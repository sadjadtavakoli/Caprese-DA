package refdiff.berkak;

import java.io.File;
import refdiff.core.RefDiff;
import refdiff.core.diff.CstDiff;
import refdiff.parsers.js.JsPlugin;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.eclipse.jgit.revwalk.RevCommit;

public class RefDiffBerkak {
	private static String changesPath = "data/changes/";

	public static void main(String[] args) throws Exception {
		String repoLink = args[0];
		String commitSha = args[1];
		String dataPath = args[2];
		String mappingsPath = args[3];
		String removedPath = args[4];
		int counter = Integer.parseInt(args[5]);
		boolean currentVersion = counter == 0;
		// String repoLink = "https://github.com/sadjad-tavakoli/sample_project.git";
		// String commitSha = "a5deb46558ebde4d57e4d2620c503604dd2ef7fc";
		// String dataPath = "sequences.txt";
		// int counter = 200;

		new File("data").mkdir();
		new File(changesPath).mkdir();
		File commitFolder = new File("data/" + commitSha);

		try (JsPlugin jsPlugin = new JsPlugin()) {
			// TODO sadjad it should be able from where it ended in its previous execution
			RefDiff refDiffJs = new RefDiff(jsPlugin);

			File repo = refDiffJs.cloneGitRepository(commitFolder, repoLink);
			RevCommit commit = refDiffJs.getCommit(repo, commitSha);
			if (currentVersion) {
				findCurrentVersionChanges(refDiffJs, repo, commit, dataPath, removedPath);
			} else {
				minRepo(refDiffJs, repo, commit, counter, dataPath, mappingsPath, removedPath);
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static void findCurrentVersionChanges(RefDiff refDiffJs, File repo, RevCommit commit, String dataPath,
			String removedPath) throws Exception {
		if (commit.getParentCount() != 1) {
			System.out.println("two parents" + commit.getName());
		}
		if (commit.getParentCount() > 0) {
			RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
			CstDiff diffForCommit = refDiffJs.computeDiffForCommit(repo, commitPr, commit);
			List<String> changes = new ArrayList<>();

			changes.addAll(diffForCommit.getNonValidChangedFiles());
			changes.addAll(diffForCommit.getChangedEntitiesKeys());
			changes.addAll(diffForCommit.getAddedEntitiesKeys());

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

	private static void minRepo(RefDiff refDiffJs, File repo, RevCommit commit, int counter, String dataPath,
			String mappingsPath, String removedPath) throws Exception {
		if (commit.getParentCount() != 1) {
			System.out.println("two parents" + commit.getName());
		}
		counter--;
		if (commit.getParentCount() > 0) {

			RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
			CstDiff diffForCommit = refDiffJs.computeDiffForCommit(repo, commitPr, commit, mappingsPath);
			List<String> changes = new ArrayList<>();
			changes.addAll(diffForCommit.getNonValidChangedFiles());
			changes.addAll(diffForCommit.getChangedEntitiesKeys());
			changes.addAll(diffForCommit.getAddedEntitiesKeys());
			if (!changes.isEmpty() && changes.size() < 100 && changes.size() > 1) { // 30 is set based on Rose paper //
																					// elimate sequences of length 1
				Collections.sort(changes);
				String changesString = changes.toString().replaceAll("[\\[\\],\"]", "");
				try (FileWriter file = new FileWriter(dataPath, true)) {
					file.write(changesString + " -1 -2 \n");
					file.flush();
				}
			} else {
				System.out.println("no changes detected " + commit.getName());
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

			if (counter > 0) {
				minRepo(refDiffJs, repo, commitPr, counter, dataPath, mappingsPath, removedPath);
			}
		}
	}
}
