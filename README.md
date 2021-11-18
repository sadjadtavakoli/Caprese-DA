# Berke
Berke is a function-level change impact analysis tool using Dynamic Analysis and co-occurace. Follow the instruction below to run berke. 
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

After installing NodeProf and RefDiff, you should initialize the required constants in Berke/constants.js, Then run the following command:
```
node berke.js
```

The output of this execution will be accessible in the data directory specified in Berke/constants.js file. 


