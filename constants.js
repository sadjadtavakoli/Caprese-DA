const path = require('path');

// const REPO_URL = "https://github.com/sadjad-tavakoli/sample_project.git";
// const REPO_URL = "git@github.com:http-party/http-server.git";
// const REPO_URL = "git@github.com:Automattic/mongoose.git";
// const REPO_URL = "git@github.com:node-fetch/node-fetch.git";
// const REPO_URL = "git@github.com:thenativeweb/node-cqrs-eventdenormalizer.git"
// const REPO_URL = "git@github.com:bpampuch/pdfmake.git"
// const REPO_URL = "git@github.com:pmandadapu9/Jhipster.git"
// const REPO_URL = "git@github.com:devleague/curry-house-styel07.git"
// const REPO_URL = "git@github.com:RomanSaveljev/jenkins-job-builder-js.git"
// const REPO_URL = "git@github.com:dtex/j5e.git"
// const REPO_URL = "git@github.com:antirek/ding-dong.git"
// const REPO_URL = "git@github.com:andornaut/statezero.git"


/*
 ********  !  ******  !  ******  !  ******  !  ******  !  *********
 ****                                                        ******
 ***    Fill the following constants before running berke     *****
 ****                                                        ******    
 ****************************************************************** 
 */

/**
 * your repository address
 */
const REPO_URL = "git@github.com:jhipster/jhipster-uml.git"

/**
 *  the main branch of your repository; it is usually master or main.
 */
const REPO_MAIN_BRANCH = "master"

/**
 * the relative address of your project's test directory
 * Example:
 *     Assume your project's test directory is GreatProject/subdir/tests/
 *     you should set REPO_TEST_RELATIVE_DIR="subdir/tests/"
 */
const REPO_TEST_RELATIVE_DIR = "test/";


/**
 * The first commits with which you want to begin the whole analysis. 
 * You can leave it empty if you want to begin with the latest one. 
 */
const SEED_COMMIT = "";

/**
 * Where you want to keep the analysis data, including sequences, dependencies, and the final report. 
 * By default it's addressed to "berke/data/"
 */
const DATA_PATH = __dirname + path.sep + 'data'

/**
 * The number of commits you want to mine through the co-occurrence analysis phase
 */
const REPO_DIGGING_DEPTH = 1000;

/**
 * REPO_PATH, Your project path
 */
 const PROJECT_NAME = [...REPO_URL.matchAll("[\\w\\.-]+(?=.git)")].pop();
 const REPO_PATH = DATA_PATH + path.sep + PROJECT_NAME;
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
 * reported data paths
 */
const SEQUENCES_PATH = DATA_PATH + path.sep + "sequences.txt"; // changes extracted from commits 
const REMOVED_PATH = DATA_PATH + path.sep + "removed.txt"; // removed functions/files extracted from commnits 
const CURRENT_CHANGES_PATH = DATA_PATH + path.sep + "currentVersionChanges.txt"; // latest version's changes 
const PATTERNS_PATH = DATA_PATH + path.sep + "patterns.json"; // detected co-change patterns mined based on extracted changes 
const DA_DEPENDENCIES_PATH = DATA_PATH + path.sep + "dependencies.json"; // recorded dependencies by dynamic analysis
const DA_CALL_SEQUENCE_PATH = DATA_PATH + path.sep + "call_sequences.txt"; // call sequences recorded by dynamic analysis 
const MAPPINGS_PATH = DATA_PATH + path.sep + "mappings.json" // unigue key mappings for functions in different revisions
const KEEP_READABLE_TRACE_LOG = true // recording function call traces, accessable in DA subdirecory (BETTER TO CHANGE THIS ADDRESS)


/**
 * refdiff, clasp, and DA execution commands
*/
const REFDIFF_COMMAND = "cd " + REFDIFF_PATH + " ; ./gradlew run --args=";
const CLASP_COMMAND = "cd " + CLASP_PATH + " ; mvn exec:java -Dexec.mainClass='clasp_AGP.MainCMClaSP' -Dexec.args=";
const DA_COMMAND = "cd " + DA_PATH + " ; $GRAAL_HOME/bin/node --nodeprof.Scope=app --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis utils.js --analysis analyser.js runner.js";

module.exports = {
    REPO_URL, PROJECT_NAME, REPO_TEST_RELATIVE_DIR, SEED_COMMIT, REPO_PATH, REFDIFF_PATH, REPO_MAIN_BRANCH, MAPPINGS_PATH,
    CLASP_PATH, DA_PATH, SEQUENCES_PATH, PATTERNS_PATH, DATA_PATH, REPO_DIGGING_DEPTH, REFDIFF_COMMAND, REMOVED_PATH,
    CLASP_COMMAND, DA_COMMAND, DA_DEPENDENCIES_PATH, DA_CALL_SEQUENCE_PATH, KEEP_READABLE_TRACE_LOG, CURRENT_CHANGES_PATH
}