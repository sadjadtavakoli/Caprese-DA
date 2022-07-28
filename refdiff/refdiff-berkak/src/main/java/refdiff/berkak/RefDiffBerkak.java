package refdiff.berkak;

import java.io.File;
import refdiff.core.RefDiff;
import refdiff.core.diff.CstDiff;
import refdiff.core.io.SourceFileSet;
import refdiff.core.util.PairBeforeAfter;
import refdiff.parsers.js.JsPlugin;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.AbstractMap.SimpleEntry;

import org.eclipse.jgit.revwalk.RevCommit;

public class RefDiffBerkak {
	private static File repo;
	private static RefDiff refDiffJs;
	private static String dataPath;
	private static String removedPath;
	private static Integer depth;
	
	public static void main(String[] args) throws Exception {
		String repoLink = args[0];
		String commitSha = args[1];
		dataPath = args[2];
		removedPath = args[3];
		depth = Integer.parseInt(args[4]);
		String mappingsPath = args[5];
		List<String> filesToExclude;
		try {
			filesToExclude = Arrays.asList(args[6].split(","));
		} catch (ArrayIndexOutOfBoundsException e) {
			filesToExclude = Arrays.asList();
		}

		new File("data").mkdir();
		File commitFolder = new File("data/" + repoLink + "/" + commitSha);

		try (JsPlugin jsPlugin = new JsPlugin(filesToExclude)) {
			refDiffJs = new RefDiff(jsPlugin);
			repo = refDiffJs.cloneGitRepository(commitFolder, repoLink);

			RevCommit commit = refDiffJs.getCommit(repo, commitSha);

			if (depth == 0) {
				findCurrentVersionChanges(commit);
			} else {
			     Integer counter = depth;
				    while (commit != null && counter != 0) {
					commit = minRepo(commit, mappingsPath, 0);
					counter--;
				}
			}

			List<SimpleEntry<String, String>> branchesSides = getBranchSides(commit);

			for(SimpleEntry<String, String> branchSides: branchesSides){
				RevCommit iterationPointer = refDiffJs.getCommit(repo, branchSides.getKey());
				String end = branchSides.getValue();
				String branchMappingPath = mappingsPath + branchSides.getKey();
				iterationPointer = minRepo(iterationPointer, branchMappingPath, 1);
				while (!iterationPointer.getName().equals(end)) {
					iterationPointer = minRepo(iterationPointer, branchMappingPath, 0);
				}
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static RevCommit minRepo(RevCommit commit, String mappingsPath, Integer parentIndex) throws Exception {

		if (commit.getParentCount() == 0) return null;
		
		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(parentIndex));
		PairBeforeAfter<SourceFileSet> beforeAndAfter = refDiffJs.getResources(repo, commitPr, commit);
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(beforeAndAfter, mappingsPath);
		
		List<String> changes = new ArrayList<>();
		
		changes.addAll(diffForCommit.getChangedEntitiesKeys());
		changes.addAll(diffForCommit.getAddedEntitiesKeys());
		addToRemoved(diffForCommit.getRemovedEntitiesKeys());
		
		boolean isALargeCommit = beforeAndAfter.getAfter().getSourceFiles().size() >= 30; 
		boolean isASmallCommit= changes.size() <= 1;

		if (!isALargeCommit && !isASmallCommit) {

			Collections.sort(changes);
			String changesString = cleanChanges(changes);
		
			try (FileWriter file = new FileWriter(dataPath, true)) {
				file.write(changesString + " -1 \n");
				file.flush();
			}
			try (FileWriter file = new FileWriter(dataPath + "details.txt", true)) { // for evaluation purposes
				file.write(commit.getName() + " : " + changesString + " -1 \n");
				file.flush();
			}

		} else {
			String commString = commit.getName();
			if (isALargeCommit) {
				commString += " => Large";
			} else {
				commString += " => Short";
			}
			try (FileWriter file = new FileWriter(dataPath + "-eliminated.txt", true)) {
				file.write(commString + "\n");
				file.flush();
			}
		}

		return commitPr;
	}

	private static void findCurrentVersionChanges(RevCommit commit) throws Exception {
		if (commit.getParentCount() == 0) return;
		
		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
		CstDiff diffForCommit = refDiffJs.computeDiffForCommitNoMapping(repo, commitPr, commit);

		List<String> changes = new ArrayList<>();

		changes.addAll(diffForCommit.getChangedEntitiesKeys());
		changes.addAll(diffForCommit.getRemovedEntitiesKeys());
		addToRemoved(diffForCommit.getRemovedEntitiesKeys());

		String changesString;
		if (!changes.isEmpty()) {
			changesString = cleanChanges(changes);
		} else {
			changesString = "no changes detected ";
		}

		try (FileWriter file = new FileWriter(dataPath, false)) {
			file.write(changesString);
			file.flush();
		}

		addToRemoved(diffForCommit.getRemovedEntitiesKeys());
	}

	private static void addToRemoved(Set<String> removed) throws IOException {

		if (!removed.isEmpty()) {
			String removedString = removed.toString().replaceAll("[\\[\\]\"]", "");
			try (FileWriter file = new FileWriter(removedPath, false)) {
				file.write(removedString + ", ");
				file.flush();
			}
		}
	}

	private static String cleanChanges(List<String> changes) {
		return changes.toString().replaceAll("[\\[\\],\"]", "");
	}

	private static ArrayList<SimpleEntry<String, String>> getBranchSides(RevCommit commit) {
		ArrayList<SimpleEntry<String, String>> result = new ArrayList<>();
		List<RevCommit> mainBranchCommits = new ArrayList<>();
		List<RevCommit> commitsWithTwoParents = new ArrayList<>();
		Integer depthCounter = depth;

		RevCommit recursiveCommit = commit;		
		while (depthCounter != 0) { // we can find this forLoop's information from the main iteration at this function's call location
			int parentsCount = recursiveCommit.getParentCount();
			if (parentsCount == 2) {
				commitsWithTwoParents.add(recursiveCommit);
			}
			if (parentsCount == 0)
				break;

			mainBranchCommits.add(recursiveCommit);
			recursiveCommit = refDiffJs.getCommit(repo, recursiveCommit.getParent(0));
			depthCounter--;
		}

		for (RevCommit orgCommit : commitsWithTwoParents) {

			RevCommit pointerCommit = refDiffJs.getCommit(repo, orgCommit.getParent(1));

			while (pointerCommit.getParentCount() > 0) {
				RevCommit pointerParentCommit = refDiffJs.getCommit(repo, pointerCommit.getParent(0));
				if (mainBranchCommits.contains(pointerParentCommit)) {
					result.add(new SimpleEntry<>(orgCommit.getName(), pointerParentCommit.getName()));
					break;
				}
				pointerCommit = pointerParentCommit;
			}
		}
		return result;

	}
}
