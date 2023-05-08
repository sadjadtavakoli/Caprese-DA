const path = require('path');
const fs = require('fs');

/*
 ****** ! ** ! ** ! ** ! ** ! ** ! ** ! ** ! ** ! ** ! ** ! *******
 ****                                                        ******
 ***   Fill the following constants before running the tool   *****
 ****                                                        ******
 ******************************************************************
 */

/**
 * your repository HTTP address
 */
const REPO_URL = "https://github.com/expressjs/express.git" 
// const REPO_URL = "https://github.com/expressjs/session.git" 

/**
 * the main branch of your repository; it is usually master or main.
 */
const REPO_MAIN_BRANCH = "master" // 

/**
 * the relative address of your project's test directory
 * Example:
 *     Assume your project's test directory is GreatProject/subdir/tests/
 *     you should set REPO_TEST_RELATIVE_DIR="subdir/tests/"
 */
const REPO_TEST_RELATIVE_DIR = "test";


/**
 * the relative addresses of your project's test subdirectories that must be excluded. 
 * Example:
 *     Assume your project's test directory is GreatProject/subdir/tests/
 *     and you want GreatProject/subdir/tests/fixture/ to be excluded.
 *     you should set REPO_TEST_EXCLUDED_DIRS = ["fixture"]
 */
const REPO_TEST_EXCLUDED_DIRS = [];

/**
 * The first commits with which you want to begin the whole analysis. 
 * You can leave it empty if you want to begin with the latest one. 
 */
const SEED_COMMIT = "" // 

/**
 * Where you want to keep the analysis data, including sequences, dependencies, and the final report. 
 * By default it's addressed to "data/"
 */
let DATA_PATH = __dirname + path.sep + 'data'

const PROJECT_NAME = [...REPO_URL.matchAll("[\\w\\.-]+(?=.git)")].pop();

/**
 * REPO_PATH, Your project path
 */
const REPO_PATH = DATA_PATH + path.sep + PROJECT_NAME;

/*
 ****************************************************************************
 ****                                                                  ******
 ***   NO NEED TO CHANGE THE FOLLOWING VARIABLES (of course you can!)   *****
 ****                                                                  ******    
 **************************************************************************** 
 */

/**
 * refdiff, FPD, and DA directories path which by defualt are in the main directory.
 */
const DA_PATH = __dirname + path.sep + "DA";

/**
 * refdiff, FPD, and DA execution commands
*/
const DA_COMMAND = `cd ${DA_PATH}\n$GRAAL_HOME${path.sep}bin${path.sep}node --nodeprof.Scope=app --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME${path.sep}nodeprof.jar --nodeprof $NODEPROF_HOME${path.sep}jalangi.js --analysis utils.js --analysis analyser.js runner.mjs`;

/**
 * reported data paths
 */
const DA_DEPENDENCIES_PATH = DATA_PATH + path.sep + "dependencies.json"; // recorded dependencies by dynamic analysis
const Caprese_RESULT_PATH = DATA_PATH + path.sep + "caprese.json"; // caprese result 

if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH);
    addFile(DA_DEPENDENCIES_PATH, "{}")
    addFile(Caprese_RESULT_PATH, "")
}

function addFile(filePath, data) {
    if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, data)
    }
}

module.exports = {
    REPO_URL, PROJECT_NAME, REPO_TEST_RELATIVE_DIR, SEED_COMMIT, REPO_PATH, REPO_MAIN_BRANCH,
    REPO_TEST_EXCLUDED_DIRS, DA_PATH, DATA_PATH, DA_COMMAND, DA_DEPENDENCIES_PATH, Caprese_RESULT_PATH,
}