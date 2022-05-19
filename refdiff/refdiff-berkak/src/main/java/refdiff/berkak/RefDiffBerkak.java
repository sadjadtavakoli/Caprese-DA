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
import java.util.Collections;
import java.util.List;

import org.eclipse.jgit.revwalk.RevCommit;

public class RefDiffBerkak {
	private static String changesPath = "data/changes/";
	private static int oneLengthCommitsCount = 0;
	private static int moreThanLimitationLengthCommitsCount = 0;
	private static int zeroLenghCommitsCount = 0;

	public static void main(String[] args) throws Exception {
		String repoLink = args[0];
		String commitSha = args[1];
		String dataPath = args[2];
		String removedPath = args[3];
		// String repoLink = "https://github.com/sadjad-tavakoli/sample_project.git";
		// String commitSha = "a5deb46558ebde4d57e4d2620c503604dd2ef7fc";
		// String dataPath = "sequences.txt";
		// int counter = 200;

		new File("data").mkdir();
		new File(changesPath).mkdir();
		File commitFolder = new File("data/" + repoLink + "/" + commitSha);
		try (JsPlugin jsPlugin = new JsPlugin()) {
			RefDiff refDiffJs = new RefDiff(jsPlugin);

			File repo = refDiffJs.cloneGitRepository(commitFolder, repoLink);
			RevCommit commit = refDiffJs.getCommit(repo, commitSha);

			try {
				int counter = Integer.parseInt(args[4]);
				if (counter == 0) {
					findCurrentVersionChanges(refDiffJs, repo, commit, dataPath, removedPath);
				} else {
					String mappingsPath = args[5];
					while (commit != null && counter != 0) {
						commit = minRepo(refDiffJs, repo, commit, dataPath, mappingsPath,
								removedPath);
						counter--;
						System.out.println(counter);
					}
					System.out.println(oneLengthCommitsCount);
					System.out.println(moreThanLimitationLengthCommitsCount);
					System.out.println(zeroLenghCommitsCount);
				}
			} catch (NumberFormatException e) { // for evaluation
				String mappingsPath = args[5];
				while (commit != null && !commit.getName().equals(args[4])) {
					commit = minRepo(refDiffJs, repo, commit, dataPath, mappingsPath, removedPath);
				}
				commit = minRepo(refDiffJs, repo, commit, dataPath, mappingsPath, removedPath);
				commit = minRepo(refDiffJs, repo, commit, dataPath, mappingsPath, removedPath);
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static RevCommit minRepo(RefDiff refDiffJs, File repo, RevCommit commit, String dataPath,
			String mappingsPath, String removedPath) throws Exception {
		if (commit.getParentCount() != 1) {
			System.out.println("two parents" + commit.getName());
		}
		RevCommit commitPr = null;
		if (commit.getParentCount() > 0) {
			commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
			PairBeforeAfter<SourceFileSet> beforeAndAfter = refDiffJs.getResources(repo, commitPr, commit);
			CstDiff diffForCommit = refDiffJs.computeDiffForCommit(beforeAndAfter, mappingsPath, commit.getName());
			List<String> changes = new ArrayList<>();
			changes.addAll(diffForCommit.getNonValidChangedFiles());// @Sadjad TODO these three should be all in one
			changes.addAll(diffForCommit.getChangedEntitiesKeys());
			changes.addAll(diffForCommit.getAddedEntitiesKeys());

			if (beforeAndAfter.getAfter().getSourceFiles().size() < 30 && !changes.isEmpty() && changes.size() > 1) {
				Collections.sort(changes);
				String changesString = changes.toString().replaceAll("[\\[\\],\"]", "");
				try (FileWriter file = new FileWriter(dataPath, true)) {
					file.write(changesString + " -1 \n");
					file.flush();
				}
				try (FileWriter file = new FileWriter(dataPath + "details.txt", true)) {
					file.write(commit.getName() + " : " + changesString + " -1 \n");
					file.flush();
				}
			} else {
				if (beforeAndAfter.getAfter().getSourceFiles().size() >= 30) {
					System.out.println("BIG ONE! " + commit.getName());
				} else if (changes.size() == 1) {
					oneLengthCommitsCount++;
					// System.out.println("one change detected " + commit.getName());
				} else {
					zeroLenghCommitsCount++;
					// System.out.println("no changes detected " + commit.getName());

				}
			}

			List<String> removed = new ArrayList<>();
			removed.addAll(diffForCommit.getRemovedEntitiesKeys());

			if (!removed.isEmpty()) {
				String removedString = removed.toString().replaceAll("[\\[\\]\"]", "");
				try (FileWriter file = new FileWriter(removedPath, true)) {
					file.write(removedString + ", ");
					file.flush();
				}
			}
		}
		return commitPr;
	}

	private static void findCurrentVersionChanges(RefDiff refDiffJs, File repo, RevCommit commit, String dataPath,
			String removedPath) throws Exception {
		if (commit.getParentCount() > 0) {
			RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
			CstDiff diffForCommit = refDiffJs.computeDiffForCommitNoMapping(repo, commitPr, commit);
			List<String> changes = new ArrayList<>();

			changes.addAll(diffForCommit.getNonValidChangedFiles());
			changes.addAll(diffForCommit.getChangedEntitiesKeys());
			changes.addAll(diffForCommit.getRemovedEntitiesKeys());

			if (!changes.isEmpty()) {
				String changesString = changes.toString().replaceAll("[\\[\\],\"]", "");
				try (FileWriter file = new FileWriter(dataPath, false)) {
					file.write(changesString);
					file.flush();
				}
			} else {
				System.out.println("no changes detected " + commit.getName());
			}

			List<String> removed = new ArrayList<>();
			removed.addAll(diffForCommit.getRemovedEntitiesKeys());

			if (!removed.isEmpty()) {
				String removedString = removed.toString().replaceAll("[\\[\\]\"]", "");
				try (FileWriter file = new FileWriter(removedPath, false)) {
					file.write(removedString + ", ");
					file.flush();
				}
			}
		}
	}
}
