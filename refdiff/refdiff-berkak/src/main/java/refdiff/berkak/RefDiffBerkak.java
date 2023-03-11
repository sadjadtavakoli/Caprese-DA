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
import java.util.List;
import java.util.Set;

import org.eclipse.jgit.revwalk.RevCommit;

public class RefDiffBerkak {
	private static File repo;
	private static RefDiff refDiffJs;
	private static String dataPath;
	private static String removedPath;

	public static void main(String[] args) throws Exception {
		String repoLink = args[0];
		String commitSha = args[1];
		dataPath = args[2];
		removedPath = args[3];
		Integer depth = Integer.parseInt(args[4]);
		String mappingsPath = args[5];
		List<String> filesToExclude;
		try {
			filesToExclude = Arrays.asList(args[6].split(","));
		} catch (ArrayIndexOutOfBoundsException e) {
			filesToExclude = Arrays.asList();
		}

		new File("data").mkdir();
        String sep = System.getProperty("file.separator");
		String commitFolderPath = "data" + sep + repoLink + sep + commitSha;
		
		File commitFolder = new File(commitFolderPath);
        commitFolder.mkdir();

		Integer counter = depth;

		try (JsPlugin jsPlugin = new JsPlugin(filesToExclude)) {
			refDiffJs = new RefDiff(jsPlugin);
			repo = refDiffJs.cloneGitRepository(commitFolder, repoLink);

			RevCommit commit = refDiffJs.getCommit(repo, commitSha);

			List<RevCommit> mainBranchCommits = new ArrayList<>();
			List<RevCommit> commitsWithTwoParents = new ArrayList<>();

            String tempMappingsDir = commitFolderPath + sep + "mappings" + sep;
            new File(tempMappingsDir).mkdirs();
    
			if (depth == 0) {
				findCurrentVersionChanges(commit);
			} else {
				while (commit.getParentCount() != 0 && counter != 0) {
					mainBranchCommits.add(commit);
					commit = mineMainBranch(commit, mappingsPath, 0);
					if (commit.getParentCount() == 2) { // this can change to "if commit.getParentCount == 2" 
						File dirTo = new File(tempMappingsDir + commit.getName() + ".json");
						Files.copy(Path.of(mappingsPath), dirTo.toPath(), StandardCopyOption.REPLACE_EXISTING);
						commitsWithTwoParents.add(commit);
					}
					counter--;
					System.out.print(counter);
					System.out.print(" . ");
				}
			}

			List<List<String>> branchesSides = getBranchSides(mainBranchCommits, commitsWithTwoParents); // we also can find main branch commmits and commits with two parents list in the following iteration as well. 
			List<String> alreadyMet = new ArrayList<>();
			for (List<String> branchSides : branchesSides) {
				RevCommit iterationPointer = refDiffJs.getCommit(repo, branchSides.get(0));
				String end = branchSides.get(1);
				String branchMappingPath = tempMappingsDir + branchSides.get(0) + ".json";

				alreadyMet.add(iterationPointer.getName());
				iterationPointer = mineMainBranch(iterationPointer, branchMappingPath, 1);
				while (iterationPointer.getParentCount() !=0 && !alreadyMet.contains(iterationPointer.getName()) && !iterationPointer.getName().equals(end)) {
					counter--;
					System.out.print(counter);
					System.out.print(" . ");
					alreadyMet.add(iterationPointer.getName());
					iterationPointer = mineSideBranches(iterationPointer, branchMappingPath);
				}
				Files.deleteIfExists(Path.of(branchMappingPath));
			}
            System.out.println("\nDone!");

		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static RevCommit mineMainBranch(RevCommit commit, String mappingsPath, Integer parentIndex) throws IOException {

		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(parentIndex));
		PairBeforeAfter<SourceFileSet> beforeAndAfter = refDiffJs.getResources(repo, commitPr, commit);
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(beforeAndAfter, mappingsPath, commit.getName()+" " + parentIndex);

		addToRemoved(diffForCommit.getRemovedEntitiesKeys());
		if(parentIndex==0 && commit.getParentCount() != 2){
			addToSequenceSet(dataPath, diffForCommit, beforeAndAfter, commit.getName());
		}
		return commitPr;
	}

	private static RevCommit mineSideBranches(RevCommit commit, String mappingsPath) throws IOException {

		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
		PairBeforeAfter<SourceFileSet> beforeAndAfter = refDiffJs.getResources(repo, commitPr, commit);
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(beforeAndAfter, mappingsPath, commit.getName());

		addToRemoved(diffForCommit.getRemovedEntitiesKeys());
		addToSequenceSet(dataPath, diffForCommit, beforeAndAfter, commit.getName());
		return commitPr;
	}

	private static void addToSequenceSet(String resultPath, CstDiff diffForCommit, PairBeforeAfter<SourceFileSet> beforeAndAfter, String commitName) throws IOException {

		List<String> changes = new ArrayList<>();

		changes.addAll(diffForCommit.getChangedEntitiesKeys());
		changes.addAll(diffForCommit.getAddedEntitiesKeys());

		boolean isALargeCommit = beforeAndAfter.getAfter().getSourceFiles().size() >= 30;
		boolean isASmallCommit = changes.size() <= 1;
		
		if (!isALargeCommit && !isASmallCommit) {
			Collections.sort(changes);
			String changesString = cleanStrings(changes);

			write(resultPath+ ".txt", changesString + " -1 \n",true);
			
            // for evaluation
			write(resultPath + "-details.txt", commitName + " : " + changesString + " -1 \n",true);

		} else {
			if (isALargeCommit) {
				commitName += " => Large";
			} else {
				commitName += " => Short";
			}
			write(dataPath + "-eliminated.txt", commitName + "\n",true);
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

		write(dataPath, changesString,false);
	}

	private static void addToRemoved(Set<String> removed) throws IOException {

		if (!removed.isEmpty()) {
			String removedString = cleanStrings(new ArrayList<>(removed));
			write(removedPath, removedString + " ", true);
		}
	}

	private static String cleanStrings(List<String> changes) {
		return changes.toString().replaceAll("[\\[\\],\"]", "");
	}

	private static List<List<String>> getBranchSides(List<RevCommit> mainBranchCommits, List<RevCommit> commitsWithTwoParents) {
		List<List<String>> result = new ArrayList<>();

		for (RevCommit orgCommit : commitsWithTwoParents) {
			RevCommit pointerCommit = refDiffJs.getCommit(repo, orgCommit.getParent(1));
			while (pointerCommit.getParentCount() > 0) {
				RevCommit pointerParentCommit = refDiffJs.getCommit(repo, pointerCommit.getParent(0));
				if (mainBranchCommits.contains(pointerParentCommit)) {
					result.add(Arrays.asList(orgCommit.getName(), pointerParentCommit.getName()));
					break;
				}
				pointerCommit = pointerParentCommit;
			}
		}
		return result;
	}

	private static void write(String dataPath, String content, boolean append) throws IOException{
		try (FileWriter file = new FileWriter(dataPath, append)) {
			file.write(content);
			file.flush();
		}
	}
}
