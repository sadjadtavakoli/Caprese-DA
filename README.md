# Berke
Berke is a function-level change impact analysis tool using Dynamic Analysis and co-occurace. Follow the instruction below to run berke.

1- Install NodeProf ([check here](#NodeProf)) \
2- Install RefDiff ([check here](#RefDiff))\
3- Initialize the required constants ([check here](#Berke))\
4- It's ready to go! ([check here](#Berke)) 

------------------------------------------------------------

# NodeProf 
Berke uses NodeProf for its dynamic analysis phase. NodeProf is an efficient instrumentation and profiling framework for [Graal.js](https://github.com/graalvm/graaljs).

## Getting started

To install nodeProf, You can follow [this instruction](https://github.com/Haiyang-Sun/nodeprof.js.git). 

NodeProf is available under the following license:

* [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)

------------------------------------------------------------
# RefDiff 
Berke uses a changed version of Refdiff to detect the changed entities (available [here](https://github.com/sadjad-tavakoli/RefDiff.git)).

RefDiff originally is a tool to mine refactorings in the commit history of git repositories. In Berke we changed it to detect changed entities between two different revisions.

## Getting started

Before building the project, make sure you have git and a Java Development Kit (JDK) version 8 installed in your system. Also, set the JAVA_HOME environment variable to point to the installation directory of the desired JDK.

Go to berke/refdiff directory, then use gradlew to install Refdiff. 

* You can find the original instruction [here](https://github.com/aserg-ufmg/RefDiff).

------------------------------------------------------------
# Berke

## needed a bit coding action

After installing NodeProf and RefDiff, you should initialize the required constants in Berke/constants.js.

## ready to go

Run the following command to run berke:
```
node berke.js
```

The output of this execution will be accessible in the data directory specified in Berke/constants.js file. 


