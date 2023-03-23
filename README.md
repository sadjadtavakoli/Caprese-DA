# Caprese
Caprese is a function-level change impact analysis tool using Dynamic Analysis and Frequent Pattern Mining. Follow the instruction below to run Caprese.

1- Install NodeProf ([check here](#NodeProf))\
2- Install RefDiff ([check here](#RefDiff))\
3- Install dependencies ([check here](#Projects_Dependencies))\
4- Initialize the required constants ([check here](#Run))\
5- It's ready to go! ([check here](#Run)) 

------------------------------------------------------------

# Install NodeProf 
Caprese uses NodeProf for its dynamic analysis phase. NodeProf is an efficient instrumentation and profiling framework for [Graal.js](https://github.com/graalvm/graaljs).

## Getting started

To install nodeProf, You can follow [this instruction](https://github.com/Haiyang-Sun/nodeprof.js/tree/master/docs/panathon18). 

NodeProf is available under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

------------------------------------------------------------
# Install RefDiff 
Caprese uses a changed version of Refdiff to detect the changed entities.

RefDiff originally is a tool to mine refactorings in the commit history of git repositories. In Caprese we changed it to detect changed entities between two different revisions.

## Getting started

Before building the project, make sure you have git and a Java Development Kit (JDK) version 8 installed in your system. Also, set the JAVA_HOME environment variable to point to the installation directory of the desired JDK.

Go to refdiff/ directory, then use gradlew to install Refdiff. 


------------------------------------------------------------
# Install Other Dependencies
## dynamic analaysis
Change your directory to "DA/", then run ```npm install``` in order to install dynamic anlaysis dependencies.
```
## frequent pattern detection
Install the latest version of [Maven](https://maven.apache.org/index.html), if you do not have it installed already. 


------------------------------------------------------------
# Run

## Needs a bit of coding action

After installing all of the requirements, you should initialize the required constants in Caprese/constants.js.
Those constants include the following: 
- repo_url: Repository url, 
- repo_main_branch: The main branch’s name, 
- repo_test_relative_dir: The relative path of the test directory, 
- repo_test_excluded_dirs: the test paths to be excluded from dynamic analysis, 
- fpd_excluded_dirs: the paths to be excluded from frequent pattern detection unit, 
- seed_commit: the commit to start the analysis with it.

You can also modify any other constants based on your unique needs, like digging depth of the repository, the storage path, etc.


## Ready to go

Run the following command to extract dynamic dependencies:
```
node Caprese.js da
```

Run the following command to extract sequences:
```
node Caprese.js mine
```

After these commands, the following command can be used to get the impacted functions by a change set. In this command, the functions provided as input must be between double quotation marks, separated by space, and follow the naming format of *functionName-filePath-firstLine-LastLine*. If the function is anonymous, immediate, or arrow function, you should set the name as *arrowAnonymousFunction*. Also, if the change is in the main body of a file, not in any function, you should only mention the *filePath*. 
* An example of a list of functions: "getAssist-main/assist/getAssists.js-12-18 arrowAnonymousFunction-main/index.js-10-13 index.js"

```
node Caprese.js detect "change set"
```

The output of this execution will be accessible in Caprese/capreseResult.json file. 


