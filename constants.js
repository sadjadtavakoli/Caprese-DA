const path = require('path');
const fs = require('fs');
let benchmakrsConfig = JSON.parse(fs.readFileSync(`${__dirname}/evaluation/benchmarks/benchmarksData.json`));
/*
 ****** ! ** ! ** ! ** ! ** ! ** ! ** ! ** ! ** ! ** ! ** ! *******
 ****                                                        ******
 ***   Fill the following constants before running the tool   *****
 ****                                                        ******
 ******************************************************************
 */

/**
 * your repository SSH address
 */

const REPO_URL = "git@github.com:simov/grant.git"

/**
 * the main branch of your repository; it is usually master or main.
 */
const REPO_MAIN_BRANCH = benchmakrsConfig[REPO_URL]['main_branch'] // 

/**
 * the relative address of your project's test directory
 * Example:
 *     Assume your project's test directory is GreatProject/subdir/tests/
 *     you should set REPO_TEST_RELATIVE_DIR="subdir/tests/"
 */
const REPO_TEST_RELATIVE_DIR = benchmakrsConfig[REPO_URL]['test'];


/**
 * the relative addresses of your project's test subdirectories that must be excluded. 
 * Example:
 *     Assume your project's test directory is GreatProject/subdir/tests/
 *     and you want GreatProject/subdir/tests/fixture/ to be excluded.
 *     you should set REPO_TEST_EXCLUDED_DIRS = ["fixture"]
 */
const REPO_TEST_EXCLUDED_DIRS = benchmakrsConfig[REPO_URL]['excluded_dirs'];

/**
 * The relative path of files that you want to be excluded from FP analysis
 */
const FP_EXCLUDED_DIRS = benchmakrsConfig[REPO_URL]['fp_excluded_dirs']
/**
 * The first commits with which you want to begin the whole analysis. 
 * You can leave it empty if you want to begin with the latest one. 
 */
const SEED_COMMIT = benchmakrsConfig[REPO_URL]['seed_commit'] // 


/**
 * The number of commits you want to mine through the co-occurrence analysis phase
 */
const REPO_DIGGING_DEPTH = -1;

/**
 * Where you want to keep the analysis data, including sequences, dependencies, and the final report. 
 * By default it's addressed to "berke/data/"
 */
let DATA_PATH = __dirname + path.sep + 'data'

/**
 * REPO_PATH, Your project path
 */
const PROJECT_NAME = [...REPO_URL.matchAll("[\\w\\.-]+(?=.git)")].pop();
const REPO_PATH = DATA_PATH + path.sep + "Projects" + path.sep + PROJECT_NAME;

//  FOR EVALUATION
DATA_PATH = __dirname + path.sep + 'data' + path.sep + "ProjectsData" + path.sep + PROJECT_NAME; // for evaluation, REMOVE THIS @TODO

/*
 ****************************************************************************
 ****                                                                  ******
 ***   NO NEED TO CHANGE THE FOLLOWING VARIABLES (of course you can!)   *****
 ****                                                                  ******    
 **************************************************************************** 
 */

/**
 * refdiff, FPD, and DA directories path which by defualt are subdirectories of berke.
 */
const REFDIFF_PATH = __dirname + path.sep + "refdiff";
const FP_PATH = __dirname + path.sep + "FPD";
const DA_PATH = __dirname + path.sep + "DA";

/**
 * refdiff, FPD, and DA execution commands
*/
const REFDIFF_COMMAND = "cd " + REFDIFF_PATH + " ; ./gradlew run --args=";
const FP_COMMAND = "cd " + FP_PATH + " ; mvn exec:java -Dexec.mainClass='patterndetection.MainAlgorithm' -Dexec.args=";
const DA_COMMAND = "cd " + DA_PATH + " ; $GRAAL_HOME/bin/node --nodeprof.Scope=app --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis utils.js --analysis analyser.js runner.mjs";

/**
 * reported data paths
 */
const SEQUENCES_PATH = DATA_PATH + path.sep + "sequences.txt"; // changes extracted from commits 
const REMOVED_PATH = DATA_PATH + path.sep + "removed.txt"; // removed functions/files extracted from commnits 
const CURRENT_CHANGES_PATH = DATA_PATH + path.sep + "currentVersionChanges.txt"; // latest version's changes 
const FP_RESULT_PATH = DATA_PATH + path.sep + "fp_result.json"; // detected impact-set based on commits' changes
const DA_DEPENDENCIES_PATH = DATA_PATH + path.sep + "dependencies.json"; // recorded dependencies by dynamic analysis
const MAPPINGS_PATH = DATA_PATH + path.sep + "mappings.json" // unigue key mappings for functions in different revisions
const Berke_RESULT_PATH = DATA_PATH + path.sep + "berke.json"; // berke result 

module.exports = {
    REPO_URL, PROJECT_NAME, REPO_TEST_RELATIVE_DIR, SEED_COMMIT, REPO_PATH, REFDIFF_PATH, REPO_MAIN_BRANCH, REPO_TEST_EXCLUDED_DIRS,
    FP_PATH, DA_PATH, SEQUENCES_PATH, FP_RESULT_PATH, DATA_PATH, REPO_DIGGING_DEPTH, REFDIFF_COMMAND, REMOVED_PATH,
    FP_COMMAND, DA_COMMAND, DA_DEPENDENCIES_PATH, CURRENT_CHANGES_PATH, MAPPINGS_PATH, Berke_RESULT_PATH, FP_EXCLUDED_DIRS
}