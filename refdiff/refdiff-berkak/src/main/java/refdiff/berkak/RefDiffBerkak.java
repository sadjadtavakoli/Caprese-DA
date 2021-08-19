package refdiff.berkak;

import java.io.File;
import refdiff.core.RefDiff;
import refdiff.core.cst.CstNode;
import refdiff.core.diff.CstDiff;
import refdiff.parsers.js.JsPlugin;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import org.eclipse.jgit.revwalk.RevCommit;

public class RefDiffBerkak {

	public static void main(String[] args) throws Exception {
		// String repo = args[0];
		// String commit = args[1];
		// String previousCommit = args[2];
		int counter = 0;

		String repoLink = "https://github.com/vuejs/vuex.git";
		String commitSha = "8029c3951af788eb0e704222ff1b0a21918546c1";

		new File("data").mkdir();
		new File("data/changes").mkdir();
		File commitFolder = new File("data/" + commitSha);

		try (JsPlugin jsPlugin = new JsPlugin()) {
			// TODO sadjad it should be able from where it ended in its previous execution
			RefDiff refDiffJs = new RefDiff(jsPlugin);

			File repo = refDiffJs.cloneGitRepository(commitFolder, repoLink);
			RevCommit commit = refDiffJs.getCommit(repo, commitSha);
			minRepo(refDiffJs, repo, commit, counter);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	private static void minRepo(RefDiff refDiffJs, File repo, RevCommit commit, int counter) throws Exception {
		if (commit.getParentCount() != 1) {
			System.out.println("two parents" + commit.getName());
		}
		// Check commits without changes, what's going on in them. Also check what would
		// happen for commits with just added files. Also, check changes in commits such
		// as 4c60cf5580e407c115b0b39737e5179f3f879a47
		counter++;
		RevCommit commitPr = refDiffJs.getCommit(repo, commit.getParent(0));
		Date date = commit.getCommitterIdent().getWhen();
		String fileName = String.format("%s-%s-%s-%s", date.getYear(), date.getMonth(), date.getDate(),
				commit.getAuthorIdent().getEmailAddress());
		CstDiff diffForCommit = refDiffJs.computeDiffForCommit(repo, commitPr, commit);
		Set<String> changes = new HashSet<>();
		changes.addAll(diffForCommit.getNonValidChangedFiles());
		changes.addAll(diffForCommit.getChangedEntitiesKeys());
		Set<CstNode> addedEntities = diffForCommit.getAddedEntities();
		String sequence = "";
		if (!changes.isEmpty()) {
			sequence = changes.toString();
		}
		if (!addedEntities.isEmpty()) {
			sequence = sequence.concat(addedEntities.toString());
		}
		if (!sequence.trim().isEmpty()) {
			sequence = sequence.replaceAll("[\\[\\],\"]", "") + " -1 ";
			try (FileWriter file = new FileWriter("data/changes/" + fileName + ".txt", true)) {
				file.write(sequence);
				file.flush();
			}	
		}
		if (counter < 100) {
				minRepo(refDiffJs, repo, commitPr, counter);
			}
	}
}
