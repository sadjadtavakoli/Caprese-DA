package refdiff.berkak;

import java.io.File;
import refdiff.core.RefDiff;
import refdiff.core.diff.CstDiff;
import refdiff.parsers.js.JsPlugin;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.eclipse.jgit.revwalk.RevCommit;

public class RefDiffBerkak {
	private static String changesPath = "data/changes/";

	public static void main(String[] args) throws Exception {
		String repoLink = args[0];
		String commitSha = args[1];
		String dataPath = args[2];
		int counter = 0;
		
		// repoLink = "https://github.com/vuejs/vuex.git";
		// commitSha = "8029c3951af788eb0e704222ff1b0a21918546c1";
		// dataPath = "sequences.txt";

		new File("data").mkdir();
		new File(changesPath).mkdir();
		new File(dataPath);
		File commitFolder = new File("data/" + commitSha);

		try (JsPlugin jsPlugin = new JsPlugin()) {
			// TODO sadjad it should be able from where it ended in its previous execution
			RefDiff refDiffJs = new RefDiff(jsPlugin);

			File repo = refDiffJs.cloneGitRepository(commitFolder, repoLink);
			RevCommit commit = refDiffJs.getCommit(repo, commitSha);
			minRepo(refDiffJs, repo, commit, counter);
			fileMerge(dataPath);

		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static void minRepo(RefDiff refDiffJs, File repo, RevCommit commit, int counter) throws Exception {
		if (commit.getParentCount() != 1) {
			System.out.println("two parents" + commit.getName());
		}
		counter++;
		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
		Date date = commit.getCommitterIdent().getWhen();
		String fileName = String.format("%s-%s-%s-%s", date.getYear(), date.getMonth(), date.getDate(),
				commit.getAuthorIdent().getEmailAddress());
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(repo, commitPr, commit);
		List<String> changes = new ArrayList<>();
		changes.addAll(diffForCommit.getNonValidChangedFiles());
		changes.addAll(diffForCommit.getChangedEntitiesKeys());
		changes.addAll(diffForCommit.getAddedEntitiesKeys());

		if (!changes.isEmpty()) {
			Collections.sort(changes);
			String sequence = changes.toString().replaceAll("[\\[\\],\"]", "") + " -1 ";
			try (FileWriter file = new FileWriter(changesPath + fileName + ".txt", true)) {
				file.write(sequence);
				file.flush();
			}
		}else{
			System.out.println("no changes detected " + commit.getName());
		}
		if (counter < 100) {
			minRepo(refDiffJs, repo, commitPr, counter);
		}
	}

	public static void fileMerge(String dataPath) throws IOException {

		PrintWriter pw = new PrintWriter(dataPath);
		File folder = new File(changesPath);
		File[] listOfFiles = folder.listFiles();

		for (File file : listOfFiles) {
			if (file.isFile()) {
				String content = Files.readString(file.toPath());
				file.delete();
				pw.println(content + "-2");
			}
		}
		pw.flush();
		pw.close();
	}
}
