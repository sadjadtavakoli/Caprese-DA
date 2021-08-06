package refdiff.berkak;

import java.io.File;
import refdiff.core.RefDiff;
import refdiff.core.diff.CstDiff;
import refdiff.parsers.js.JsPlugin;
import java.io.FileWriter;
import java.io.IOException;

import org.eclipse.jgit.revwalk.RevCommit;

public class RefDiffBerkak {

	public static void main(String[] args) throws Exception {
		// String repo = args[0];
		// String commit = args[1];
		// String previousCommit = args[2];

		String repoLink = "https://github.com/sadjad-tavakoli/SE-Project-BerkO.git";
		String commitSha = "9b58437d75421edbbca333a1b2bc10484789d77c";
		
		new File("data");
		File commitFolder = new File("data/" + commitSha);
		
		try (JsPlugin jsPlugin = new JsPlugin()) {
			RefDiff refDiffJs = new RefDiff(jsPlugin);

			File repo = refDiffJs.cloneGitRepository(new File(commitFolder, "berkeTests.git"), repoLink);
			RevCommit commit = refDiffJs.getCommit(repo, commitSha);

			minRepo(refDiffJs, repo, commit);

		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static void minRepo(RefDiff refDiffJs, File repo, RevCommit commit) throws Exception {
		System.out.println(commit.getName());
		// if(commit.getParentCount() != 1){
		// throw new RuntimeException("Commit should have one parent");
		// }else{
		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(repo, commit, commitPr);
		String result = diffForCommit.toJsonString();
		System.out.println(result);
		// minRepo(refDiffJs, repo, commitPr);
		// }
		// try (FileWriter file = new FileWriter(commitFolder + "/changes.json")) {
		// file.write(result);
		// file.flush();

		// }
	}
}
