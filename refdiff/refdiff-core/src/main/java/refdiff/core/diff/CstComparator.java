package refdiff.core.diff;

import static refdiff.core.diff.CstRootHelper.*;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;


import refdiff.core.diff.similarity.SourceRepresentationBuilder;
import refdiff.core.diff.similarity.TfIdfSourceRepresentationBuilder;
import refdiff.core.io.SourceFileSet;
import refdiff.core.cst.HasChildrenNodes;
import refdiff.core.cst.CstNode;
import refdiff.core.cst.CstNodeRelationshipType;
import refdiff.core.cst.CstNodeTypeComprator;
import refdiff.core.cst.CstRoot;
import refdiff.core.cst.Stereotype;
import refdiff.parsers.LanguagePlugin;

public class CstComparator {

	private final LanguagePlugin languagePlugin;

	public CstComparator(LanguagePlugin parser) {
		this.languagePlugin = parser;
	}

	public CstDiff compare(SourceFileSet sourcesBefore, SourceFileSet sourcesAfter, CstComparatorMonitor monitor,
			String mappingsPath, String commit) {
		try {
			DiffBuilder<?> diffBuilder = new DiffBuilder<>(new TfIdfSourceRepresentationBuilder(), sourcesBefore,
					sourcesAfter, monitor, mappingsPath);
			return diffBuilder.computeDiff(commit);
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public CstDiff compareNoMapping(SourceFileSet sourcesBefore, SourceFileSet sourcesAfter,
			CstComparatorMonitor monitor) {
		try {
			DiffBuilder<?> diffBuilder = new DiffBuilder<>(new TfIdfSourceRepresentationBuilder(), sourcesBefore,
					sourcesAfter, monitor, "");
			return diffBuilder.computeDiffNoMapping();
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public class DiffBuilder<T> {
		private final SourceRepresentationBuilder<T> srb;
		private CstDiff diff;
		private CstRootHelper<T> before;
		private CstRootHelper<T> after;
		private Set<CstNode> changed;
		private Set<CstNode> added;
		private Set<String> changedEntitiesKeys;
		private Set<String> addedEntitiesKeys;
		private Set<String> removedEntitiesKeys;
		private String mappingsPath;
		private ThresholdsProvider threshold = new ThresholdsProvider();
		private CstComparatorMonitor monitor;
		private JsonObject mappings;

		private final Map<CstNode, CstNode> mapBeforeToAfter = new HashMap<>();
		private final Map<CstNode, CstNode> mapAfterToBefore = new HashMap<>();
		private Set<String> nonValidChangedFilesBefore = new HashSet<>();
		private Set<String> nonValidChangedFilesAfter = new HashSet<>();

		DiffBuilder(SourceRepresentationBuilder<T> srb, SourceFileSet sourcesBefore, SourceFileSet sourcesAfter,
				CstComparatorMonitor monitor, String mappingsPath) throws Exception {
			this.srb = srb;
			CstRoot cstRootBefore = languagePlugin.parse(sourcesBefore, nonValidChangedFilesBefore);
			CstRoot cstRootAfter = languagePlugin.parse(sourcesAfter, nonValidChangedFilesAfter);
			this.diff = new CstDiff(cstRootBefore, cstRootAfter);
			this.before = new CstRootHelper<>(this.diff.getBefore(), sourcesBefore, srb, true);
			this.after = new CstRootHelper<>(this.diff.getAfter(), sourcesAfter, srb, false);
			this.changed = new HashSet<>();
			this.added = new HashSet<>();
			this.changedEntitiesKeys = new HashSet<>();
			this.addedEntitiesKeys = new HashSet<>();
			this.removedEntitiesKeys = new HashSet<>();
			this.mappingsPath = mappingsPath;
			this.monitor = monitor;

			this.diff.getBefore().forEachNode((node, depth) -> this.changed.add(node));

			this.diff.getAfter().forEachNode((node, depth) -> this.added.add(node));

			monitor.beforeCompare(before, after);

		}

		public CstDiff getDiff() {
			return diff;
		}

		CstDiff computeDiff(String commit) throws IOException {
			match();
			getMappings();
			findAddedEntities();
			findRemovedEntities();
			findChangedEntities(commit);
			writeMappings();
			addDetections();
			return diff;
		}

		CstDiff computeDiffNoMapping() {
			match();
			findAddedEntitiesNoMapping();
			findRemovedEntitiesNoMapping();
			findChangedEntitiesNoMapping();
			addDetections();
			return diff;
		}

		private void match() {
			computeSourceRepresentationForRemovedAndAdded();
			findMatchesById();
			findMatchesByUniqueName(0.75);
			findMatchesBySimilarity(true);
			findMatchesBySimilarity(false);
			findMatchesByChildren();
		}

		private void addDetections() {
			addNonValidFiles();
			diff.setChangedEntitiesKeys(this.changedEntitiesKeys);
			diff.setAddedEntitiesKeys(this.addedEntitiesKeys);
			diff.setRemovedEntitiesKeys(this.removedEntitiesKeys);
		}

		private void addNonValidFiles(){
			for (String fileKeyBefore : this.nonValidChangedFilesBefore) {
				boolean isChanged = false;
				for (String fileKeyAfter : this.nonValidChangedFilesAfter) {
					if (fileKeyAfter.equals(fileKeyBefore)) {
						this.changedEntitiesKeys.add(fileKeyAfter);
						isChanged = true;
						this.nonValidChangedFilesAfter.remove(fileKeyAfter);
						break;
					}
				}
				if (!isChanged) {
					this.removedEntitiesKeys.add(fileKeyBefore);
				}
			}
			for (String fileKey : this.nonValidChangedFilesAfter) {
				this.addedEntitiesKeys.add(fileKey);
			}
		}
		
		private void computeSourceRepresentationForRemovedAndAdded() {
			for (CstNode node : changed) {
				before.computeSourceRepresentation(node);
			}
			for (CstNode node : added) {
				after.computeSourceRepresentation(node);
			}
		}

		private void findMatchesByUniqueName(double threshold) {
			List<PotentialMatch> candidates = new ArrayList<>();
			for (CstNode n1 : changed) {
				String name = n1.getLocalName();
				if (!arrowAnonymousFunction(n1) && before.findByLocalName(name).size() == 1) {
					List<CstNode> n2WithSameName = after.findByLocalName(name);
					if (n2WithSameName.size() == 1) {
						CstNode n2 = n2WithSameName.get(0);
						if (added(n2) && sameType(n1, n2)) {
							Optional<RelationshipType> optRelationshipType = findRelationshipForCandidate(n1, n2);
							if (optRelationshipType.isPresent()) {
								double score = computeHardSimilarityScore(n1, n2);
								boolean emptyBody = isAbstract(n1, n2);
								if (!emptyBody && score > threshold) {
									PotentialMatch candidate = new PotentialMatch(n1, n2,
											Math.max(before.depth(n1), after.depth(n2)), score);
									candidates.add(candidate);
								}
							}
						}
					}
				}
			}
			Collections.sort(candidates);
			for (PotentialMatch candidate : candidates) {
				addMatch(candidate.getNodeBefore(), candidate.getNodeAfter());
			}
		}

		private void findMatchesBySimilarity(boolean onlySafe) {
			List<PotentialMatch> candidates = new ArrayList<>();
			for (CstNode n1 : changed) {
				for (CstNode n2 : added) {
					if (sameType(n1, n2) && !anonymous(n1) && !anonymous(n2)) {
						boolean safePair = sameLocation(n1, n2);
						if (!arrowAnonymousFunction(n1)) {
							safePair = sameName(n1, n2) || safePair;
						}
						double thresholdValue = safePair ? threshold.getMinimum() : threshold.getIdeal();
						if (!onlySafe || safePair) {
							Optional<RelationshipType> optRelationshipType = findRelationshipForCandidate(n1, n2);
							if (optRelationshipType.isPresent()) {
								RelationshipType type = optRelationshipType.get();
								double score = computeHardSimilarityScore(n1, n2);
								double rankScore = srb.rawSimilarity(before.sourceRep(n1), after.sourceRep(n2)) * score;
								if (type.isById() || score > thresholdValue) {
									PotentialMatch candidate = new PotentialMatch(n1, n2,
											Math.max(before.depth(n1), after.depth(n2)), rankScore);
									candidates.add(candidate);
								} else {
									monitor.reportMatchDiscardedBySimilarity(n1, n2, score, thresholdValue);
								}
							}
						}
					}
				}
			}
			Collections.sort(candidates);
			for (PotentialMatch candidate : candidates) {
				addMatch(candidate.getNodeBefore(), candidate.getNodeAfter());
			}
		}

		private void findMatchesByChildren() {
			List<PotentialMatch> candidates = new ArrayList<>();
			for (CstNode n1 : changed) {
				for (CstNode n2 : added) {
					int matchingChild = countMatchingChild(n1, n2);
					if (sameType(n1, n2) && !anonymous(n1) && !anonymous(n2) && matchingChild > 1) {
						double nameScore = computeNameSimilarity(n1, n2);

						if (nameScore > 0.5) {
							Optional<RelationshipType> optRelationshipType = findRelationshipForCandidate(n1, n2);

							if (optRelationshipType.isPresent()) {
								double score = computeLightSimilarityScore(n1, n2);
								// if (score > threshold.getIdeal()) {
								PotentialMatch candidate = new PotentialMatch(n1, n2,
										Math.max(before.depth(n1), after.depth(n2)), score);
								candidates.add(candidate);
								// }
							}
						}
					}
				}
			}
			Collections.sort(candidates);
			for (PotentialMatch candidate : candidates) {
				addMatch(candidate.getNodeBefore(), candidate.getNodeAfter());
			}
		}

		private double computeHardSimilarityScore(CstNode n1, CstNode n2) {
			return srb.similarity(before.sourceRep(n1), after.sourceRep(n2));
		}

		private double computeBodyHardSimilarityScore(CstNode n1, CstNode n2) {
			return srb.similarity(before.bodySourceRep(n1), after.bodySourceRep(n2));
		}

		private double computeNameSimilarity(CstNode n1, CstNode n2) {
			double s1 = Math.max(srb.partialSimilarity(before.nameSourceRep(n1), after.nameSourceRep(n2)),
					srb.partialSimilarity(after.nameSourceRep(n2), before.nameSourceRep(n1)));
			return s1;
		}

		private double computeLightSimilarityScore(CstNode n1, CstNode n2) {
			double score1 = srb.partialSimilarity(before.sourceRep(n1), after.sourceRep(n2));
			double score2 = srb.partialSimilarity(after.sourceRep(n2), before.sourceRep(n1));
			return Math.max(score1, score2);
		}

		private Optional<RelationshipType> findRelationshipForCandidate(CstNode n1, CstNode n2) {
			if (sameLocation(n1, n2) && sameSignature(n1, n2)) {
				return Optional.of(RelationshipType.SAME);
			} else if (sameSignature(n1, n2) && n1.hasStereotype(Stereotype.TYPE_MEMBER) && after.hasRelationship(
					CstNodeRelationshipType.SUBTYPE, matchingNodeAfter(n1.getParent()), n2.getParent())) {
				return Optional.of(RelationshipType.PULL_UP);
			} else if (sameSignature(n1, n2) && n1.hasStereotype(Stereotype.TYPE_MEMBER) && after.hasRelationship(
					CstNodeRelationshipType.SUBTYPE, n2.getParent(), matchingNodeAfter(n1.getParent()))) {
				return Optional.of(RelationshipType.PUSH_DOWN);
			} else if (sameLocation(n1, n2)) {
				if (sameName(n1, n2)) {
					return Optional.of(RelationshipType.CHANGE_SIGNATURE);
				} else {
					return Optional.of(RelationshipType.RENAME);
				}
			} else if (!n1.hasStereotype(Stereotype.TYPE_CONSTRUCTOR)
					&& !n2.hasStereotype(Stereotype.TYPE_CONSTRUCTOR)) {
				if (sameSignature(n1, n2) || sameName(n1, n2)) {
					if (sameRootNode(n1, n2)) {
						return Optional.of(RelationshipType.INTERNAL_MOVE);
					} else {
						return Optional.of(RelationshipType.MOVE);
					}
				} else {
					if (sameRootNode(n1, n2)) {
						return Optional.of(RelationshipType.INTERNAL_MOVE_RENAME);
					} else {
						return Optional.of(RelationshipType.MOVE_RENAME);
					}
				}
			}
			return Optional.empty();
		}

		private void findMatchesById() {
			findMatchesById(diff.getBefore(), diff.getAfter());
		}

		private void findMatchesById(HasChildrenNodes parentBefore, HasChildrenNodes parentAfter) {
			for (CstNode n1 : children(parentBefore, this::changed)) {
				for (CstNode n2 : children(parentAfter, this::added)) {
					if (sameNamespace(n1, n2) && sameSignature(n1, n2)) {
						addMatch(n1, n2);
					}
				}
			}
		}

		private void addMatch(CstNode nBefore, CstNode nAfter) {
			if (mapBeforeToAfter.containsKey(nBefore) || mapAfterToBefore.containsKey(nAfter)) {
				monitor.reportMatchDiscardedByConflict(nBefore, nAfter);
			} else {
				mapBeforeToAfter.put(nBefore, nAfter);
				mapAfterToBefore.put(nAfter, nBefore);
				changed.remove(nBefore);
				added.remove(nAfter);
				findMatchesById(nBefore, nAfter);
			}
		}

		private void findChangedEntitiesNoMapping() {
			List<CstNode> employeeByKey = new ArrayList<>(mapBeforeToAfter.keySet());
			Collections.sort(employeeByKey, new CstNodeTypeComprator());
			for (int i = 0; i < employeeByKey.size(); i++) {
				CstNode n1 = employeeByKey.get(i);
				CstNode n2 = mapBeforeToAfter.get(n1);
				String n1Key = n1.toString();

				if(!areTheSame(n1,n2)) {
					this.changedEntitiesKeys.add(n1Key);
				}
				after.removeFromParents(n2);
				before.removeFromParents(n1);
			}
		}

		private void findChangedEntities(String commit) throws IOException {
			List<CstNode> beforekeys = new ArrayList<>(mapBeforeToAfter.keySet());
			Collections.sort(beforekeys, new CstNodeTypeComprator());

			Map<String, String> keyMappings = new HashMap<>();
			// JsonObject currentMappign = new JsonObject();
			// JsonObject mappingHisotry = getMappingsHistory();

			for (int i = 0; i < beforekeys.size(); i++) {
				CstNode n1 = beforekeys.get(i);
				CstNode n2 = mapBeforeToAfter.get(n1);
				String n1Key = n1.toString();
				String n2Key = n2.toString();
				// currentMappign.addProperty(n1Key, n2Key);

				if (this.mappings.has(n2Key)) {
					String oldKey = n2Key;
					n2Key = this.mappings.get(n2Key).getAsString();
					this.mappings.remove(oldKey);
				}
				keyMappings.put(n1Key, n2Key);

				if(!areTheSame(n1,n2)) {
					this.changedEntitiesKeys.add(n2Key);
				}
				after.removeFromParents(n2);
				before.removeFromParents(n1);
			}

			// if (!currentMappign.entrySet().isEmpty()) {
			// 	mappingHisotry.add(commit, currentMappign);
			// 	writeMappingHistory(mappingHisotry);
			// }

			for (Map.Entry<String, String> entry : keyMappings.entrySet()) {
				this.mappings.addProperty(entry.getKey(), entry.getValue());
			}
		}

		private JsonObject getMappingsHistory() throws IOException {
			JsonParser jsonParser = new JsonParser();
			String filePath = "mappingHistory.json";
			File tempFile = new File(filePath);
			JsonObject mappingHisotry = new JsonObject();
			if (!tempFile.createNewFile()) {
				try (FileReader reader = new FileReader(filePath)) {
					mappingHisotry = jsonParser.parse(reader).getAsJsonObject();// Should check the content of this file
					return mappingHisotry; // before parsing to prevent excepction
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
			return mappingHisotry;
		}

		private void writeMappingHistory(JsonObject mappingHistory) throws IOException {
			try (FileWriter myWriter = new FileWriter("mappingHistory.json")) {
				myWriter.write(mappingHistory.toString());
			} catch (IOException e) {
				e.printStackTrace();
			}

		}

		private void findAddedEntitiesNoMapping() {
			List<CstNode> addedList = new ArrayList<>(this.added);
			Collections.sort(addedList, new CstNodeTypeComprator());
			for (CstNode entry : addedList) {
				String entryKey = entry.toString();
				this.addedEntitiesKeys.add(entryKey);
				after.removeFromParents(entry);
			}
		}
		
		private void findAddedEntities() throws IOException {
			for (CstNode entry : this.added) {
				String entryKey = entry.toString();
				if (!this.mappings.has(entryKey)) {
					this.addedEntitiesKeys.add(entryKey);
				} else {
					this.addedEntitiesKeys.add(this.mappings.get(entryKey).getAsString());
				}
				after.removeFromParents(entry);
			}
		}

		private void findRemovedEntitiesNoMapping() {
			List<CstNode> changedList = new ArrayList<>(this.changed);
			Collections.sort(changedList, new CstNodeTypeComprator());
			for (CstNode entry : changedList) {
				String entryKey = entry.toString();
				this.removedEntitiesKeys.add(entryKey);
				before.removeFromParents(entry);
			}
		}

		private void findRemovedEntities() throws IOException {
			for (CstNode entry : this.changed) {
				String entryKey = entry.toString();
				this.removedEntitiesKeys.add(entryKey);
				before.removeFromParents(entry);
			}
		}

		private void getMappings() throws IOException {
			JsonParser jsonParser = new JsonParser();
			String filePath = this.mappingsPath;
			File tempFile = new File(filePath);
			this.mappings = new JsonObject();
			if (!tempFile.createNewFile()) {
				try (FileReader reader = new FileReader(filePath)) {
					this.mappings = jsonParser.parse(reader).getAsJsonObject();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}

		private void writeMappings() throws IOException {
			try (FileWriter myWriter = new FileWriter(this.mappingsPath)) {
				myWriter.write(this.mappings.toString());
			} catch (IOException e) {
				e.printStackTrace();
			}
		}


		public Optional<CstNode> matchingNodeBefore(CstNode n2) {
			return Optional.ofNullable(mapAfterToBefore.get(n2));
		}

		public Optional<CstNode> matchingNodeAfter(CstNode n1) {
			return Optional.ofNullable(mapBeforeToAfter.get(n1));
		}

		public Optional<CstNode> matchingNodeAfter(Optional<CstNode> optN1) {
			if (optN1.isPresent()) {
				return matchingNodeAfter(optN1.get());
			}
			return Optional.empty();
		}

		public boolean sameLocation(CstNode n1, CstNode n2) {
			if (n1.getParent().isPresent() && n2.getParent().isPresent()) {
				return matchingNodeAfter(n1.getParent().get()).equals(n2.getParent());
			} else if (!n1.getParent().isPresent() && !n1.getParent().isPresent()) {
				return sameNamespace(n1, n2);
			} else {
				return false;
			}
		}

		public boolean sameRootNode(CstNode n1, CstNode n2) {
			Optional<CstNode> n1Root = n1.getRootParent();
			Optional<CstNode> n2Root = n2.getRootParent();
			if (n1Root.isPresent() && n2Root.isPresent()) {
				return matchingNodeAfter(n1Root.get()).equals(n2Root);
			} else {
				return false;
			}
		}

		public boolean areTheSame(CstNode n1, CstNode n2){
			double score = computeBodyHardSimilarityScore(n1, n2);
			return n1.getParameters().size() == n2.getParameters().size() && score >= 1; 
		}

		public boolean isAbstract(CstNode n1, CstNode n2) {
			return n1.hasStereotype(Stereotype.ABSTRACT) || n2.hasStereotype(Stereotype.ABSTRACT);
		}

		public boolean changed(CstNode n) {
			return this.changed.contains(n);
		}

		public boolean added(CstNode n) {
			return this.added.contains(n);
		}

		public int countMatchingChild(CstNode n1, CstNode n2) {
			if (n1.getNodes().isEmpty() || n2.getNodes().isEmpty()) {
				return 0;
			}
			int count = 0;
			for (CstNode n1Child : n1.getNodes()) {
				Optional<CstNode> maybeN2Child = matchingNodeAfter(n1Child);
				if (maybeN2Child.isPresent()) {
					if (childOf(maybeN2Child.get(), n2)) {
						count++;
					}
				}
			}
			return count;
		}

		public List<CstNode> children(HasChildrenNodes nodeWithChildren, Predicate<CstNode> predicate) {
			return nodeWithChildren.getNodes().stream().filter(predicate).collect(Collectors.toList());
		}

	}

	public LanguagePlugin getLanguagePlugin() {
		return languagePlugin;
	}

}
