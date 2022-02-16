package refdiff.core;

import java.io.File;
import java.util.function.BiConsumer;

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
	 * Compute a CST diff between a commit and its parent commit (previous revision).
	 * This method will throw an exception if the given commit has more than one parent (e.g., merge commits).
	 * 
	 * @param gitRepository The folder of the git repository (you should pass the .git folder if the repository is not on bare mode).
	 * @param commitSha1 SHA1 (or git object reference) that identifies the commit.
	 * @return The computed CST diff.
	 */
	public CstDiff computeDiffForCommit(File gitRepository, String commitSha1, String mappingsPath) {
		return computeDiffForCommit(gitRepository, commitSha1, new CstComparatorMonitor() {}, mappingsPath);
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
	 * Compute a CST diff between a commit and its parent commit (previous revision).
	 * This method will throw an exception if the given commit has more than one parent (e.g., merge commits).
	 * 
	 * @param gitRepository The folder of the git repository (you should pass the .git folder if the repository is not on bare mode).
	 * @param commitSha1 SHA1 (or git object reference) that identifies the commit.
	 * @param monitor CstComparatorMonitor object that can be used to inspect CST relationships discarded along the process.
	 * @return The computed CST diff.
	 */
	public CstDiff computeDiffForCommit(File gitRepository, String commitSha1, CstComparatorMonitor monitor, String mappingsPath) {
		try (Repository repo = GitHelper.openRepository(gitRepository)) {
			PairBeforeAfter<SourceFileSet> beforeAndAfter = GitHelper.getSourcesBeforeAndAfterCommit(repo, commitSha1, fileFilter);
			return comparator.compare(beforeAndAfter, monitor, mappingsPath);
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
	public CstDiff computeDiffForCommit(PairBeforeAfter<SourceFileSet> beforeAndAfter, String mappingsPath) {
		return comparator.compare(beforeAndAfter.getBefore(), beforeAndAfter.getAfter(), new CstComparatorMonitor() {}, mappingsPath);
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
	public CstDiff computeDiffForCommit(File gitRepository, RevCommit commit1, RevCommit commit2) {
		try (Repository repo = GitHelper.openRepository(gitRepository)) {
			PairBeforeAfter<SourceFileSet> beforeAndAfter = GitHelper.getSourcesBeforeAndAfterCommit(repo, commit1, commit2, fileFilter);
			return comparator.compare(beforeAndAfter.getBefore(), beforeAndAfter.getAfter(), new CstComparatorMonitor() {});
		}
	}

	/**
	 * Compute a CST diff between two commits.
	 * This method will throw an exception if the given commit has more than one parent (e.g., merge commits).
	 * 
	 * @param gitRepository The folder of the git repository (you should pass the .git folder if the repository is not on bare mode).
	 * @param commitSha1 SHA1 (or git object reference) that identifies the commit.
	 * @param commitSha2 SHA2 (or git object reference) that identifies the previous commit.
	 * @param monitor CstComparatorMonitor object that can be used to inspect CST relationships discarded along the process.
	 * @return The computed CST diff.
	 */
	public CstDiff computeDiffForCommit(File gitRepository, String commitSha1, String commitSha2, String mappingsPath) {
		try (Repository repo = GitHelper.openRepository(gitRepository)) {
			PairBeforeAfter<SourceFileSet> beforeAndAfter = GitHelper.getSourcesBeforeAndAfterCommit(repo, commitSha1, commitSha2, fileFilter);
			return comparator.compare(beforeAndAfter, new CstComparatorMonitor() {}, mappingsPath);
		}
	}
	
	/**
	 * Compute the CST diff for each commit in the git repository, starting from HEAD.
	 * 
	 * @param gitRepository The folder of the git repository (you should pass the .git folder if the repository is not on bare mode).
	 * @param maxDepth Number of commits that will be navigated backwards at maximum.
	 * @param diffConsumer Consumer function that will be called for each computed CST diff.
	 */
	public void computeDiffForCommitHistory(File gitRepository, int maxDepth, BiConsumer<RevCommit, CstDiff> diffConsumer, String mappingsPath) {
		computeDiffForCommitHistory(gitRepository, "HEAD", maxDepth, diffConsumer, mappingsPath);
	}
	
	/**
	 * Compute the CST diff for each commit in the git repository, starting from the specified commit. Merge comits are skipped.
	 * 
	 * @param gitRepository The folder of the git repository (you should pass the .git folder if the repository is not on bare mode).
	 * @param startAt git object reference of the starting commit.
	 * @param maxDepth Number of commits that will be navigated backwards at maximum.
	 * @param diffConsumer Consumer function that will be called for each computed CST diff.
	 */
	public void computeDiffForCommitHistory(File gitRepository, String startAt, int maxDepth, BiConsumer<RevCommit, CstDiff> diffConsumer, String mappingsPath) {
		try (Repository repo = GitHelper.openRepository(gitRepository)) {
			GitHelper.forEachNonMergeCommit(repo, startAt, maxDepth, (revBefore, revAfter) -> {
				PairBeforeAfter<SourceFileSet> beforeAndAfter = GitHelper.getSourcesBeforeAndAfterCommit(repo, revBefore, revAfter, fileFilter);
				CstDiff diff = comparator.compare(beforeAndAfter, mappingsPath);
				diffConsumer.accept(revAfter, diff);
			});
		}
	}
	
	/**
	 * Low level method that computes the CST diff between two arbitrary revisions.
	 * This method operates directly with jgit objects such as {@code Repository} and {@code RevCommit}.
	 * 
	 * For more details on jgit library, please refer to <a href="https://wiki.eclipse.org/JGit/User_Guide#Concepts">JGit documentation</a>.
	 * 
	 * @param repo The jgit repository object.
	 * @param revBefore The jgit commit object before the change.
	 * @param revAfter The jgit commit object after the change.
	 * @return The computed CST diff between revisions.
	 */
	public CstDiff computeDiffBetweenRevisions(Repository repo, RevCommit revBefore, RevCommit revAfter, String mappingsPath) {
		PairBeforeAfter<SourceFileSet> beforeAndAfter = GitHelper.getSourcesBeforeAndAfterCommit(repo, revBefore, revAfter, fileFilter);
		return comparator.compare(beforeAndAfter, mappingsPath);
	}
	
}
