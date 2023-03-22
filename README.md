# Caprese
Caprese is a function-level change impact analysis tool using Dynamic Analysis and Frequent Pattern Mining. Follow the instruction below to run Caprese.

1- Install NodeProf ([check here](#NodeProf))\
2- Install RefDiff ([check here](#RefDiff))\
3- Initialize the required constants ([check here](#Run))\
4- It's ready to go! ([check here](#Run)) 

------------------------------------------------------------

# NodeProf 
Caprese uses NodeProf for its dynamic analysis phase. NodeProf is an efficient instrumentation and profiling framework for [Graal.js](https://github.com/graalvm/graaljs).

## Getting started

To install nodeProf, You can follow [this instruction](https://github.com/Haiyang-Sun/nodeprof.js.git). 

NodeProf is available under the following license:

* [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

------------------------------------------------------------
# RefDiff 
Caprese uses a changed version of Refdiff to detect the changed entities.

RefDiff originally is a tool to mine refactorings in the commit history of git repositories. In Caprese we changed it to detect changed entities between two different revisions.

## Getting started

Before building the project, make sure you have git and a Java Development Kit (JDK) version 8 installed in your system. Also, set the JAVA_HOME environment variable to point to the installation directory of the desired JDK.

Go to refdiff/ directory, then use gradlew to install Refdiff. 

* You can find the original instruction [here](https://github.com/aserg-ufmg/RefDiff).

------------------------------------------------------------
# Run

## Needs a bit of coding action

After installing NodeProf and RefDiff, you should initialize the required constants in Caprese/constants.js.

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


