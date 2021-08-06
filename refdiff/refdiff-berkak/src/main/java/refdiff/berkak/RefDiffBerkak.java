package refdiff.berkak;

import java.io.File;
import refdiff.core.RefDiff;
import refdiff.core.diff.CstDiff;
import refdiff.parsers.js.JsPlugin;
import java.io.FileWriter;
import java.io.IOException;

public class RefDiffBerkak {

	public static void main(String[] args) throws Exception {
		String repo = args[0];
		String commit = args[1];
		String previousCommit = args[2];
		run(repo, commit, previousCommit);
	}

	private static void run(String repoLink, String commit, String previousCommit) throws Exception {
		// This is a temp folder to clone or checkout git repositories.
		new File("data");
		File commitFolder = new File("data/" + commit);

		// Creates a RefDiff instance configured with the JavaScript plugin.
		try (JsPlugin jsPlugin = new JsPlugin()) {
			RefDiff refDiffJs = new RefDiff(jsPlugin);

			File repo = refDiffJs.cloneGitRepository(new File(commitFolder, "berkeTests.git"), repoLink);

			CstDiff diffForCommit = refDiffJs.computeDiffForCommit(repo, previousCommit, commit);
			String result = diffForCommit.toJsonString();
			System.out.println(result);
			try (FileWriter file = new FileWriter(commitFolder + "/changes.json")) {
				file.write(result);
				file.flush();	 
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
}
