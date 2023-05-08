# Caprese-DA
Caprese-DA is a function-level dynamic dependency extractor and change impact analysis tool for Node.js application. Follow the instruction below to run Caprese.

1- Install dependencies ([check here](#install-dependencies))\
2- Initialize the required constants ([check here](#needs-a-bit-of-coding-action))\
3- It's ready to go! ([check here](#ready-to-go))

------------------------------------------------------------
# Install Dependencies
### Install NodeProf 
Caprese-DA uses NodeProf for dynamic analysis. NodeProf is an efficient instrumentation and profiling framework for [Graal.js](https://github.com/graalvm/graaljs).

To install nodeProf, You can follow [this instruction](https://github.com/Haiyang-Sun/nodeprof.js/tree/master/docs/panathon18). 

NodeProf is available under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)
### Other Dependencies
Run ```npm install``` in order to install other dependencies.

------------------------------------------------------------
# Run

## Needs a bit of coding action

After installing all dependencies, you should initialize the required constants in "Caprese/constants.js".
The customizable variables include the followings: 
- REPO_URL: Repository url
- REPO_MAIN_BRANCH: The main branch’s name
- REPO_TEST_RELATIVE_DIR: The relative path of the test directory
- REPO_TEST_EXCLUDED_DIRS: the test paths to be excluded from dynamic analysis
- SEED_COMMIT: the commit to start the analysis with
- DATA_PATH: the storage path


You can also modify any other constants based on your unique needs, such as the digging depth of the repository.


## Ready to go

Run the following command to extract dynamic dependencies:
```
node caprese.js extract
```

After this commands, the following command can be used to get the impacted functions by a change set. In this command, the functions provided as input must be between double quotation marks, separated by space, and follow the naming format of *functionName-filePath-firstLine-LastLine*. If the function is anonymous, immediate, or arrow function, you should set the name as *arrowAnonymousFunction*. Also, if the change is in the main body of a file, not in any function, you should only mention the *filePath*. 
* An example of a list of functions: "getAssist-main/assist/getAssists.js-12-18 arrowAnonymousFunction-main/index.js-10-13 index.js"

```
node caprese.js detect "list of functions"
```

The output of this execution will be accessible in "Caprese/capreseResult.json" file. 


