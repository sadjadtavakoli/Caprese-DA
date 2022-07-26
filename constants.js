const path = require('path');

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
// const REPO_URL = "git@github.com:expressjs/express.git"
// const REPO_URL = "git@github.com:FredrikNoren/ungit.git"
// const REPO_URL = "git@github.com:jhipster/jhipster-uml.git"
const REPO_URL = "git@github.com:assemble/assemble.git"
// const REPO_URL = "git@github.com:thelounge/thelounge.git"
// const REPO_URL = "git@github.com:expressjs/session.git"
// const REPO_URL = "git@github.com:apache/cordova-ios.git"
// const REPO_URL = "git@github.com:Unitech/pm2.git"
// const REPO_URL = "git@github.com:apostrophecms/apostrophe.git"


/**
 * the main branch of your repository; it is usually master or main.
 */
const REPO_MAIN_BRANCH = "master" // express, session, ungit, thelounge, assemble, pm2, jhipster-uml
// const REPO_MAIN_BRANCH = "main" // apostrophe

/**
 * the relative addresses of your project's test directories
 * Example:
 *     Assume your project's test directory is GreatProject/subdir/tests/ and GreatProject/subdir2/test/
 *     you should set REPO_TEST_RELATIVE_DIR=["subdir/tests/", "GreatProject/subdir2/test/"]
 */
// const REPO_TEST_RELATIVE_DIR = ["test"]; //express, session, ungit, thelounge, apostrophe, assemble, jhipster-uml
// const REPO_TEST_RELATIVE_DIR = ["tests"]; // cordova-ios
const REPO_TEST_RELATIVE_DIR = ["test/programmatic", "test/interface"]; // pm2
/**
 * The first commits with which you want to begin the whole analysis. 
 * You can leave it empty if you want to begin with the latest one. 
 */
// const SEED_COMMIT = "f08ef791713bf7989f95499892b4f83c366bccc6"; // ungit
// const SEED_COMMIT = "3726a8d00bf2734add7eed3d584cc86ce16b5a6d" // thelounge
// const SEED_COMMIT = "51de04f3a9d944c1ee3c6ca08b827c154cc759df" // jhipster-uml
const SEED_COMMIT = "ec1d0e50c1d4f5a0b61ec0d9d91212ed8dc8949c" // assemble
// const SEED_COMMIT = "67b0bb2cfceb3f04fcd25a09222e86404805c594" // cordova-ios
// const SEED_COMMIT = "2573516e9321a78fb10474ea58c2cb487a663de6" // pm2
// const SEED_COMMIT = "5df613c481bc7c5979aeaeac691b64ef0a5c4948" // session
// const SEED_COMMIT = "f192c068ef0aeb2e3a0f190825c9489047850914" // apostrophe
// const SEED_COMMIT = "d854c43ea177d1faeea56189249fff8c24a764bd" // express


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
// DATA_PATH = __dirname + path.sep + 'data' + path.sep + "ProjectsData" + path.sep + PROJECT_NAME + "_up-to-date"; // for evaluation, REMOVE THIS @TODO

/*
 ****************************************************************************
 ****                                                                  ******
 ***   NO NEED TO CHANGE THE FOLLOWING VARIABLES (of course you can!)   *****
 ****                                                                  ******    
 **************************************************************************** 
 */

/**
 * refdiff, clasp, and DA directories path which by defualt are subdirectories of berke.
 */
const REFDIFF_PATH = __dirname + path.sep + "refdiff";
const CLASP_PATH = __dirname + path.sep + "clasp";
const DA_PATH = __dirname + path.sep + "DA";

/**
 * refdiff, clasp, and DA execution commands
*/
const REFDIFF_COMMAND = "cd " + REFDIFF_PATH + " ; ./gradlew run --args=";
const CLASP_COMMAND = "cd " + CLASP_PATH + " ; mvn exec:java -Dexec.mainClass='clasp_AGP.MainCMClaSP' -Dexec.args=";
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

/**
 * Files to exclude
 * The relative path of files that you want to be excluded from FP analysis
 */
const EXCLUDED = ['/assets/js/highlight.js', '/assets/js/jquery.js'] // assemble

module.exports = {
    REPO_URL, PROJECT_NAME, REPO_TEST_RELATIVE_DIR, SEED_COMMIT, REPO_PATH, REFDIFF_PATH, REPO_MAIN_BRANCH,
    CLASP_PATH, DA_PATH, SEQUENCES_PATH, FP_RESULT_PATH, DATA_PATH, REPO_DIGGING_DEPTH, REFDIFF_COMMAND, REMOVED_PATH, 
    CLASP_COMMAND, DA_COMMAND, DA_DEPENDENCIES_PATH, CURRENT_CHANGES_PATH, MAPPINGS_PATH, Berke_RESULT_PATH, EXCLUDED
}