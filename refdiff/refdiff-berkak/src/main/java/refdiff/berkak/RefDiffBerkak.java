package refdiff.berkak;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
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
import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.Map.Entry;

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
		String commitFolderPath = "data/" + repoLink + "/" + commitSha;
		String tempMappingsDir = commitFolderPath + "/" + "mappings/";
		
		File commitFolder = new File(commitFolderPath);
		new File(tempMappingsDir).mkdir();

		try (JsPlugin jsPlugin = new JsPlugin(filesToExclude)) {
			refDiffJs = new RefDiff(jsPlugin);
			repo = refDiffJs.cloneGitRepository(commitFolder, repoLink);

			RevCommit commit = refDiffJs.getCommit(repo, commitSha);
			HashMap<String, String> branchesSides = getBranchSides(commit); // we also can find main branch commmits and commits with two parents list in the following iteration as well. 
			Set<String> commitsWithTwoParents = branchesSides.keySet();

			if (depth == 0) {
				findCurrentVersionChanges(commit);
			} else {
				Integer counter = depth;
				while (commit.getParentCount() != 0 && counter != 0) {
					commit = mineMainBranch(commit, mappingsPath, 0);
					if (commitsWithTwoParents.contains(commit.getName())) { // this can change to "if commit.getParentCount == 2" 
						File dirTo = new File(tempMappingsDir + commit.getName() + ".json");
						Files.copy(Path.of(mappingsPath), dirTo.toPath(), StandardCopyOption.REPLACE_EXISTING);
					}
					counter--;
				}
			}

			List<String> alreadyMet = new ArrayList<>();
			for (Entry<String, String> branchSides : branchesSides.entrySet()) {
				RevCommit iterationPointer = refDiffJs.getCommit(repo, branchSides.getKey());
				String end = branchSides.getValue();
				String branchMappingPath = tempMappingsDir + branchSides.getKey() + ".json";
				alreadyMet.add(iterationPointer.getName());
				iterationPointer = mineMainBranch(iterationPointer, branchMappingPath, 1);
				while (iterationPointer.getParentCount() !=0 && !alreadyMet.contains(iterationPointer.getName()) && !iterationPointer.getName().equals(end)) {
					alreadyMet.add(iterationPointer.getName());
					iterationPointer = mineSideBranches(iterationPointer, branchMappingPath);
				}
				Files.deleteIfExists(Path.of(branchMappingPath));
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static RevCommit mineMainBranch(RevCommit commit, String mappingsPath, Integer parentIndex) throws IOException {

		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(parentIndex));
		PairBeforeAfter<SourceFileSet> beforeAndAfter = refDiffJs.getResources(repo, commitPr, commit);
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(beforeAndAfter, mappingsPath);

		if(parentIndex==0){
			if(commit.getParentCount() != 2){
				addToSequenceSet(dataPath, diffForCommit, beforeAndAfter, commit.getName());
			}else { // Only TARMAQ 
				addToSequenceSet(dataPath + "-onlyTARMAQ.txt", diffForCommit, beforeAndAfter, commit.getName());
			}		
		}
		return commitPr;
	}

	private static RevCommit mineSideBranches(RevCommit commit, String mappingsPath) throws IOException {

		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
		PairBeforeAfter<SourceFileSet> beforeAndAfter = refDiffJs.getResources(repo, commitPr, commit);
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(beforeAndAfter, mappingsPath);

		addToSequenceSet(dataPath, diffForCommit, beforeAndAfter, commit.getName());
		return commitPr;
	}

	private static void addToSequenceSet(String resultPath, CstDiff diffForCommit, PairBeforeAfter<SourceFileSet> beforeAndAfter, String commitName) throws IOException {

		List<String> changes = new ArrayList<>();

		changes.addAll(diffForCommit.getChangedEntitiesKeys());
		changes.addAll(diffForCommit.getAddedEntitiesKeys());
		addToRemoved(diffForCommit.getRemovedEntitiesKeys());

		boolean isALargeCommit = beforeAndAfter.getAfter().getSourceFiles().size() >= 30;
		boolean isASmallCommit = changes.size() <= 1;
		
		if (!isALargeCommit && !isASmallCommit) {
			Collections.sort(changes);
			String changesString = cleanStrings(changes);
			try (FileWriter file = new FileWriter(resultPath, true)) {
				file.write(changesString + " -1 \n");
				file.flush();
			}
			try (FileWriter file = new FileWriter(resultPath + "details.txt", true)) { // for evaluation purposes
				file.write(commitName + " : " + changesString + " -1 \n");
				file.flush();
			}
		} else {
			if (isALargeCommit) {
				commitName += " => Large";
			} else {
				commitName += " => Short";
			}
			try (FileWriter file = new FileWriter(dataPath + "-eliminated.txt", true)) {
				file.write(commitName + "\n");
				file.flush();
			}
		}
	}

	private static void findCurrentVersionChanges(RevCommit commit) throws IOException {
		if (commit.getParentCount() == 0)
			return;

		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
		CstDiff diffForCommit = refDiffJs.computeDiffForCommitNoMapping(repo, commitPr, commit);

		List<String> changes = new ArrayList<>();

		changes.addAll(diffForCommit.getChangedEntitiesKeys());
		changes.addAll(diffForCommit.getRemovedEntitiesKeys());
		addToRemoved(diffForCommit.getRemovedEntitiesKeys());

		String changesString;
		if (!changes.isEmpty()) {
			changesString = cleanStrings(changes);
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
			String removedString = cleanStrings(new ArrayList<>(removed));
			try (FileWriter file = new FileWriter(removedPath, true)) {
				file.write(removedString + ", ");
				file.flush();
			}
		}
	}

	private static String cleanStrings(List<String> changes) {
		return changes.toString().replaceAll("[\\[\\],\"]", "");
	}

	private static HashMap<String, String> getBranchSides(RevCommit commit) {
		HashMap<String, String> result = new HashMap<>();
		List<RevCommit> mainBranchCommits = new ArrayList<>();
		List<RevCommit> commitsWithTwoParents = new ArrayList<>();
		Integer depthCounter = depth;

		RevCommit recursiveCommit = commit;
		while (depthCounter != 0) { // we can find this forLoop's information from the main iteration at this
									// function's call location
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
					result.put(orgCommit.getName(), pointerParentCommit.getName());
					break;
				}
				pointerCommit = pointerParentCommit;
			}
		}
		return result;
	}
}
