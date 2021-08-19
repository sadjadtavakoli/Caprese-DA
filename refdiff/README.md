# RefDiff

RefDiff originally is a tool to mine refactorings in the commit history of git repositories.
Currently, three programming languages are supported: Java, JavaScript, and C.

RefDiff finds relationships between code elements of two given revisions of the
project. Relationships indicate that both elements are the same, or that a refactoring
operation involving them was applied. The following relationship types are supported:

* Same
* Convert Type
* Change Signature of Method/Function
* Pull Up Method
* Push Down Method
* Rename
* Move
* Move and Rename
* Extract Supertype (e.g., Class/Interface)
* Extract Method/Function
* Inline Method/Function

*This version of RefDiff can't find refactory and is changed to detect changed entities between two different versions of project. 

## This Version

This version of RefDiff will report changed entities instead of refactorings. It uses a changed version of RefDiff Core module to detect changed entities based on textual similarity.

## Getting started

Before building the project, make sure you have git and a Java Development Kit (JDK) version 8 installed in your system. Also, set the JAVA_HOME environment variable to point to the installation directory of the desired JDK.

Use gradle to create the Eclipse IDE project metadata. For example, in Windows systems:

```
cd RefDiff
gradlew eclipse
```

Note that in Linux or Mac you should run `./gradlew eclipse` to run the gradle wrapper.

You can detect changed entities in a certain repository/commit using the following code:

```java
private static void run(String repoLink, String commit, String previousCommit) throws Exception {
		// This is a temp folder to clone or checkout git repositories.
		new File("data");
		File commitFolder = new File("data/" + commit);

		// Creates a RefDiff instance configured with the JavaScript plugin.
		try (JsPlugin jsPlugin = new JsPlugin()) {
			RefDiff refDiffJs = new RefDiff(jsPlugin);

			File repo = refDiffJs.cloneGitRepository(new File(commitFolder, "berkeTests.git"), repoLink);

			CstDiff diffForCommit = refDiffJs.computeDiffForCommit(repo, commit);
			String result = diffForCommit.toJsonString();
			try (FileWriter file = new FileWriter(commitFolder + "/changes.json")) {
				file.write(result);
				file.flush();	 
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
```

You can also mine changed entities between two commits using the followin code:

```java
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
			try (FileWriter file = new FileWriter(commitFolder + "/changes.json")) {
				file.write(result);
				file.flush();	 
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
```

You can use different language plugins to mine refactorings in other programming languages:

```java
// In this example, we use the plugin for C.
CPlugin cPlugin = new CPlugin();
RefDiff refDiffC = new RefDiff(cPlugin);

File gitRepo = refDiffC.cloneGitRepository(
	new File(tempFolder, "git"),
	"https://github.com/refdiff-study/git.git");

printRefactorings(
	"Refactorings found in git ba97aea",
	refDiffC.computeDiffForCommit(gitRepo, "ba97aea1659e249a3a58ecc5f583ee2056a90ad8"));

```


## Extending RefDiff to support other programming languages

You can implement the `LanguagePlugin` interface to support other programming languages.
The `LanguagePlugin` interface is provided by the `refdiff-core` Maven artifact.
Soon, we will provide a detailed tutorial on how to do this.


## Repositories

### Original version: https://github.com/aserg-ufmg/RefDiff.git
