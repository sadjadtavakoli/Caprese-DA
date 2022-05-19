package refdiff.core;

import java.io.File;

import org.eclipse.jgit.lib.Repository;
import org.eclipse.jgit.revwalk.RevCommit;

import refdiff.core.diff.CstComparator;
import refdiff.core.diff.CstComparatorMonitor;
import refdiff.core.diff.CstDiff;
import refdiff.core.io.FilePathFilter;
import refdiff.core.io.GitHelper;
import refdiff.core.io.SourceFileSet;
import refdiff.core.util.PairBeforeAfter;
import refdiff.parsers.LanguagePlugin;

/**
 * High level API of RefDiff, providing methods to compute CST diffs between revisions (commits) of a git repository.
 */
public class RefDiff {
	
	private final CstComparator comparator;
	private final FilePathFilter fileFilter;
	
	/**
	 * Build a RefDiff instance with the specified language plugin. E.g.: {@code new RefDiff(new JsParser())}.
	 * 
	 * @param parser A language parser
	 */
	public RefDiff(LanguagePlugin parser) {
		this.comparator = new CstComparator(parser);
		this.fileFilter = parser.getAllowedFilesFilter();
	}
	
	/**
	 * Clone a git repository in a local folder.
	 * Note that the repository will be clone in bare mode (see <a href="https://git-scm.com/docs/git-clone">git clone documentation</a>).
	 * 
	 * @param destinationFolder Folder in which the repository will be cloned.
	 * @param cloneUrl The URL of the repository.
	 * @return The destination folder.
	 */
	public File cloneGitRepository(File destinationFolder, String cloneUrl) {
		return GitHelper.cloneBareRepository(destinationFolder, cloneUrl);
	}
	
	/**
	 * @param gitRepository
	 * @param commitSha1
	 * @return
	 */
	public RevCommit getCommit(File gitRepository, String commitSha1){
		try (Repository repo = GitHelper.openRepository(gitRepository)) {
			return GitHelper.getSourceOnCommit(repo, commitSha1);
		}
	}

	public RevCommit getCommit(File gitRepository, RevCommit commit){
		try (Repository repo = GitHelper.openRepository(gitRepository)) {
			return GitHelper.getSourceOnCommit(repo, commit);
		}
	}

	/**
	 * @param gitRepository The folder of the git repository (you should pass the .git folder if the repository is not on bare mode).
	 * @param commit1 first commit that identifies the commit.
	 * @param commit2 second commit that identifies the previous commit.
	 * @return SourceFileSet of commit1 and commit2
	 */
	public PairBeforeAfter<SourceFileSet> getResources(File gitRepository, RevCommit commit1, RevCommit commit2){
		try (Repository repo = GitHelper.openRepository(gitRepository)) {
			return GitHelper.getSourcesBeforeAndAfterCommit(repo, commit1, commit2, fileFilter);
		}
	}
	/**
	 * @param beforeAndAfter 
	 * @param mappingsPath 
	 * @return
	 */
	public CstDiff computeDiffForCommit(PairBeforeAfter<SourceFileSet> beforeAndAfter, String mappingsPath, String commit) {
		return comparator.compare(beforeAndAfter.getBefore(), beforeAndAfter.getAfter(), new CstComparatorMonitor() {}, mappingsPath, commit);
	}

	/**
	 * Compute a CST diff between two commits.
	 * This method will throw an exception if the given commit has more than one parent (e.g., merge commits).
	 * 
	 * @param gitRepository The folder of the git repository (you should pass the .git folder if the repository is not on bare mode).
	 * @param commit1 first commit that identifies the commit.
	 * @param commit2 second commit that identifies the previous commit.
	 * @param monitor CstComparatorMonitor object that can be used to inspect CST relationships discarded along the process.
	 * @return The computed CST diff.
	 */
	public CstDiff computeDiffForCommitNoMapping(File gitRepository, RevCommit commit1, RevCommit commit2) {
		try (Repository repo = GitHelper.openRepository(gitRepository)) {
			PairBeforeAfter<SourceFileSet> beforeAndAfter = GitHelper.getSourcesBeforeAndAfterCommit(repo, commit1, commit2, fileFilter);
			return comparator.compareNoMapping(beforeAndAfter.getBefore(), beforeAndAfter.getAfter(), new CstComparatorMonitor() {});
		}
	}
}
