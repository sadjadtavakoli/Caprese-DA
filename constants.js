const path = require('path');

const REPO_URL = "https://github.com/sadjad-tavakoli/sample_project.git";
const PROJECT_NAME = REPO_URL.match("[\\w\\.]+(?=.git)")[0];
const REPO_TEST_RELATIVE_DIR = "simpleProjectTest/tests/";
const SEED_COMMIT = "";

const PROJECTS_PATH = __dirname + path.sep + "projects";

const REPO_PATH = PROJECTS_PATH + path.sep + PROJECT_NAME;

const REFDIFF_PATH = __dirname + path.sep + "refdiff";
const CLASP_PATH = __dirname + path.sep + "clasp";
const DA_PATH = __dirname + path.sep + "DA";

const SEQUENCES_PATH = __dirname + path.sep + "sequences.txt";
const PATTERNS_PATH = __dirname + path.sep + "patterns.json";

const REPO_DIGGING_DEPTH = 200;

const REFDIFF_COMMAND = "cd " + REFDIFF_PATH + " ; ./gradlew run --args=";
const CLASP_COMMAND = "cd " + CLASP_PATH + " ; mvn exec:java -Dexec.mainClass='clasp_AGP.MainCMClaSP' -Dexec.args=";
const DA_COMMAND = "cd " + DA_PATH + " ; $GRAAL_HOME/bin/node --nodeprof.Scope=app --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis utils.js --analysis analyser.js runner.js";

module.exports = {
    REPO_URL, PROJECT_NAME, REPO_TEST_RELATIVE_DIR, SEED_COMMIT, PROJECTS_PATH,
    REPO_PATH, REFDIFF_PATH, CLASP_PATH, DA_PATH, SEQUENCES_PATH, PATTERNS_PATH,
    REPO_DIGGING_DEPTH, REFDIFF_COMMAND, CLASP_COMMAND, DA_COMMAND


}