package refdiff.berkak;

import java.io.File;
import refdiff.core.RefDiff;
import refdiff.core.diff.CstDiff;
import refdiff.parsers.js.JsPlugin;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

import org.eclipse.jgit.revwalk.RevCommit;

public class RefDiffBerkak {

	public static void main(String[] args) throws Exception {
		// String repo = args[0];
		// String commit = args[1];
		// String previousCommit = args[2];

		String repoLink = "https://github.com/sadjad-tavakoli/SE-Project-BerkO.git";
		String commitSha = "38ac4304b439f80e918a387511715372f188203e";

		new File("data");
		File commitFolder = new File("data/" + commitSha);

		try (JsPlugin jsPlugin = new JsPlugin()) {
			RefDiff refDiffJs = new RefDiff(jsPlugin);

			File repo = refDiffJs.cloneGitRepository(commitFolder, repoLink);
			RevCommit commit = refDiffJs.getCommit(repo, commitSha);

			minRepo(refDiffJs, repo, commit, commitFolder);

		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static void minRepo(RefDiff refDiffJs, File repo, RevCommit commit, File commitFolder) throws Exception {
		System.out.println(commit.getName());
		// if(commit.getParentCount() != 1){
		// throw new RuntimeException("Commit should have one parent");
		// }else{
		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(repo, commit, commitPr);
		Set<String> changes = new HashSet<>();
		// String result = diffForCommit.toJsonString();
		changes.addAll(diffForCommit.getNonValidChangedFiles());
		changes.addAll(diffForCommit.getChangedEntitiesKeys()); // must get entities names instead of whole object
		try (FileWriter file = new FileWriter(commitFolder + "/changes.json")) {
			file.write(changes.toString());
			file.flush();
		}
		// System.out.println(diffForCommit.getNonValidChangedFiles());
		// System.out.println(diffForCommit.toJsonString());
		// minRepo(refDiffJs, repo, commitPr);
		// }
		// try (FileWriter file = new FileWriter(commitFolder + "/changes.json")) {
		// file.write(result);
		// file.flush();

		// }
	}
}
