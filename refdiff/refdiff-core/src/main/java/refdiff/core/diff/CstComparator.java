package refdiff.core.diff;

import static refdiff.core.diff.CstRootHelper.*;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import refdiff.core.diff.similarity.SourceRepresentationBuilder;
import refdiff.core.diff.similarity.TfIdfSourceRepresentationBuilder;
import refdiff.core.io.SourceFile;
import refdiff.core.io.SourceFileSet;
import refdiff.core.cst.HasChildrenNodes;
import refdiff.core.cst.CstNode;
import refdiff.core.cst.CstNodeRelationshipType;
import refdiff.core.cst.CstNodeTypeComprator;
import refdiff.core.cst.CstRoot;
import refdiff.core.cst.Stereotype;
import refdiff.core.util.PairBeforeAfter;
import refdiff.parsers.LanguagePlugin;

public class CstComparator {

	private final LanguagePlugin languagePlugin;

	public CstComparator(LanguagePlugin parser) {
		this.languagePlugin = parser;
	}

	public CstDiff compare(PairBeforeAfter<SourceFileSet> beforeAndAfter) {
		return compare(beforeAndAfter.getBefore(), beforeAndAfter.getAfter(), new CstComparatorMonitor() {
		});
	}

	public CstDiff compare(PairBeforeAfter<SourceFileSet> beforeAndAfter, CstComparatorMonitor monitor) {
		return compare(beforeAndAfter.getBefore(), beforeAndAfter.getAfter(), monitor);
	}

	public CstDiff compare(SourceFileSet sourcesBefore, SourceFileSet sourcesAfter) {
		return compare(sourcesBefore, sourcesAfter, new CstComparatorMonitor() {
		});
	}

	public CstDiff compare(SourceFileSet sourcesBefore, SourceFileSet sourcesAfter, CstComparatorMonitor monitor) {
		try {
			DiffBuilder<?> diffBuilder = new DiffBuilder<>(new TfIdfSourceRepresentationBuilder(), sourcesBefore,
					sourcesAfter, monitor);
			return diffBuilder.computeDiff();
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
		private ThresholdsProvider threshold = new ThresholdsProvider();
		private CstComparatorMonitor monitor;

		private final Map<CstNode, CstNode> mapBeforeToAfter = new HashMap<>();
		private final Map<CstNode, CstNode> mapAfterToBefore = new HashMap<>();

		DiffBuilder(SourceRepresentationBuilder<T> srb, SourceFileSet sourcesBefore, SourceFileSet sourcesAfter,
				CstComparatorMonitor monitor) throws Exception {
			this.srb = srb;
			Set<String> nonValidChangedFiles = new HashSet<>();
			CstRoot cstRootBefore = languagePlugin.parse(sourcesBefore, nonValidChangedFiles);
			CstRoot cstRootAfter = languagePlugin.parse(sourcesAfter, nonValidChangedFiles);
			this.diff = new CstDiff(cstRootBefore, cstRootAfter);
			this.before = new CstRootHelper<>(this.diff.getBefore(), sourcesBefore, srb, true);
			this.after = new CstRootHelper<>(this.diff.getAfter(), sourcesAfter, srb, false);
			this.changed = new HashSet<>();
			this.changedEntitiesKeys = new HashSet<>();
			this.diff.setNonValidChangedFiles(nonValidChangedFiles); 
			this.monitor = monitor;

			Map<String, String> fileMapBefore = new HashMap<>();
			Map<String, String> fileMapAfter = new HashMap<>();

			for (SourceFile fileBefore : sourcesBefore.getSourceFiles()) {
				fileMapBefore.put(fileBefore.getPath(), sourcesBefore.readContent(fileBefore));
			}
			for (SourceFile fileAfter : sourcesAfter.getSourceFiles()) {
				fileMapAfter.put(fileAfter.getPath(), sourcesAfter.readContent(fileAfter));
			}
			this.diff.getBefore().forEachNode((node, depth) -> {
				this.changed.add(node);
			});
			this.added = new HashSet<>();
			this.diff.getAfter().forEachNode((node, depth) -> {
				this.added.add(node);
			});
			monitor.beforeCompare(before, after);
		}

		public CstDiff getDiff() {
			return diff;
		}

		CstDiff computeDiff() throws IOException {
			computeSourceRepresentationForRemovedAndAdded();
			findMatchesById();
			findMatchesByUniqueName(0.75);
			findMatchesBySimilarity(true);
			findMatchesBySimilarity(false);
			findMatchesByChildren();
			updateMapping();
			findChangedEntities();
			diff.setChangedEntitiesKeys(this.changedEntitiesKeys);
			diff.setAddedEntities(this.added);
			return diff;
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
				if (before.findByLocalName(name).size() == 1) {
					List<CstNode> n2WithSameName = after.findByLocalName(name);
					if (n2WithSameName.size() == 1) {
						CstNode n2 = n2WithSameName.get(0);
						if (added(n2) && sameType(n1, n2)) {
							// System.out.println(" findMatchesByUniqueName ");
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
						boolean safePair = sameName(n1, n2) || sameLocation(n1, n2);

						// System.out.println(" * * * * * * * ");
						// System.out.println(sameName(n1, n2));
						// System.out.println(sameLocation(n1, n2));
						// System.out.println(n1.toString());
						// System.out.println(n2.toString());
						// System.out.println(" * * * * * * * ");
						double thresholdValue = safePair ? threshold.getMinimum() : threshold.getIdeal();
						if (!onlySafe || safePair) {
							// System.out.println(" findMatchesBySimilarity ");
							Optional<RelationshipType> optRelationshipType = findRelationshipForCandidate(n1, n2);
							if (optRelationshipType.isPresent()) {
								RelationshipType type = optRelationshipType.get();
								double score = computeHardSimilarityScore(n1, n2);
								// double scoreLight = computeLightSimilarityScore(n1, n2);
								double rankScore = srb.rawSimilarity(before.sourceRep(n1), after.sourceRep(n2)) * score;
								// System.out.println(score);
								// System.out.println(scoreLight);
								// System.out.println(rankScore);
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

						// double matchingChildrenRatio = ((double) matchingChild) /
						// n1.getNodes().size();

						if (nameScore > 0.5) {
							// System.out.println(" findMatchesByChildren ");
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

		private double computeNameSimilarity(CstNode n1, CstNode n2) {
			double s1 = Math.max(srb.partialSimilarity(before.nameSourceRep(n1), after.nameSourceRep(n2)),
					srb.partialSimilarity(after.nameSourceRep(n2), before.nameSourceRep(n1)));
			// double s2 = srb.similarity(before.nameSourceRep(n1),
			// after.nameSourceRep(n2));
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
			for (CstNode n1 : children(parentBefore, this::removed)) {
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

		private void findChangedEntities() {
			Map<CstNode, CstNode> treeMap = new TreeMap<>(new CstNodeTypeComprator());
			treeMap.putAll(mapBeforeToAfter);
			for (Entry<CstNode, CstNode> entry : treeMap.entrySet()) {
				CstNode n1 = entry.getKey();
				CstNode n2 = entry.getValue();

				double score = computeHardSimilarityScore(n1, n2);

				if (score < 1) {
					after.removeFromParents(n2);
					before.removeFromParents(n1);
					this.changedEntitiesKeys.add(n2.toString());
				}
			}
		}

		private void updateMapping() throws IOException {

			// System.out.println(mapBeforeToAfter.toString().contains("getEndLine-utils.js-54-56"));
			JsonParser jsonParser = new JsonParser();

			File tempFile = new File("mappings.json");
			JsonObject mappings = new JsonObject();
			if (!tempFile.createNewFile()) {
				try (FileReader reader = new FileReader("mappings.json")) {
					mappings = jsonParser.parse(reader).getAsJsonObject();
					// System.out.println(mappings);
					reader.close();
				} catch (FileNotFoundException e) {
					e.printStackTrace();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
			for (Entry<CstNode, CstNode> entry : mapBeforeToAfter.entrySet()) {
				CstNode n1 = entry.getKey();
				CstNode n2 = entry.getValue();
				if (mappings.has(n1.toString())) {
					JsonElement value = mappings.get(n1.toString());
					mappings.remove(n1.toString());
					mappings.add(n2.toString(), value);
				} else {
					mappings.addProperty(n2.toString(), n1.toString());
				}
			}

			try {
				FileWriter myWriter = new FileWriter("mappings.json");
				myWriter.write(mappings.toString());
				myWriter.close();
			} catch (IOException e) {
				e.printStackTrace();
			}

			// System.out.println(mappings);
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

		public boolean isAbstract(CstNode n1, CstNode n2) {
			return n1.hasStereotype(Stereotype.ABSTRACT) || n2.hasStereotype(Stereotype.ABSTRACT);
		}

		public boolean removed(CstNode n) {
			return this.changed.contains(n);
		}

		public boolean added(CstNode n) {
			return this.added.contains(n);
		}

		public int countMatchingChild(CstNode n1, CstNode n2) {
			if (n1.getNodes().size() == 0 || n2.getNodes().size() == 0) {
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
