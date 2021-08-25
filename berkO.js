const path = require('path');
const exec = require('child_process').exec;
// let INITIALIZED_REPO = "https://github.com/vuejs/vuex.git"
let INITIALIZED_REPO = "https://github.com/sadjad-tavakoli/sample_project.git"
let INITIALIZED_COMMIT;
let repo;

const refDiffPath = __dirname + path.sep + "refdiff"
const claspPath = __dirname + path.sep + "clasp"
const dynamicAnlysisPath = __dirname + path.sep + "DA"

let sequencesPath = __dirname + path.sep + "sequences.txt"
let patternsPath = __dirname + path.sep + "patterns.json"
let projectsPath = __dirname + path.sep + "projects"

let digDepth = 200;

const computeChangesCommands = "cd " + refDiffPath + " ; ./gradlew run --args=";
const patternDetectionCommand = "cd " + claspPath + " ; mvn exec:java -Dexec.mainClass='clasp_AGP.MainCMClaSP' -Dexec.args="
const dynamicAnalysisCommand = "cd " + dynamicAnlysisPath + " ; $GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis utils.js --analysis analyser.js "

function run() {

    console.log(" * * * * * * * * * * * \n * * * *  Srart! * * * \n * * * * * * * * * * * \n")

    let argRepo = process.argv[2]
    if (argRepo) {
        repo = argRepo
    } else {
        repo = INITIALIZED_REPO
    }

    if (INITIALIZED_COMMIT && !argRepo) {
        pullAndCheckoutProject(INITIALIZED_COMMIT)
            .then(runDynamicAnalysis)
            .then(runRefDiff)
            .then(runClasp)
            .catch((err) => {
                console.log(err)
            })
    } else {
        getHeadCommit()
            .then(pullAndCheckoutProject)
            .then(runDynamicAnalysis)
            .then(runRefDiff)
            .then(runClasp)
            .catch((err) => {
                console.log(err)
            })
    }
}

function getHeadCommit() {
    const getHeadCommand = "cd " + projectsPath + path.sep + getProjectName() + ' ; git rev-parse HEAD'

    return new Promise(function (resolve, reject) {
        exec(getHeadCommand, (err, stdout, stderr) => {
            if (!err) {
                resolve(stdout)
            } else {
                reject(err)
            }
        })
    })
}

function pullAndCheckoutProject(commit) {
    const projectCloneCommand = "cd " + projectsPath + " ; git clone " + repo
    const pullAndCheckoutCommand = projectCloneCommand + " ; cd " + getProjectName() + " ; git fetch -a ; git checkout " + commit
    return new Promise(function (resolve, reject) {
        exec(pullAndCheckoutCommand, (err, stdout, stderr) => {
            if (!err) {
                resolve(commit)
            } else {
                reject(err)
            }
        })
    })

}

function runDynamicAnalysis(commit) {
    console.log(commit)
    return new Promise(function (resolve, reject) {
        exec(dynamicAnalysisCommand + "there supposed to be sth!", (err, stdout, stderr) => {
            if (!err) {
                resolve(commit)
            }
            else {
                reject(err)
            }
        })
    })
}
function runRefDiff(commit) {
    return new Promise(function (resolve, reject) {
        exec(computeChangesCommands + `"${repo} ${commit} ${sequencesPath} ${digDepth}"`, (err, stdout, stderr) => {
            if (!err) {
                console.log(stdout)
                resolve(commit)
            }
            else {
                reject(err)
            }
        })
    })

}

function runClasp() {
    console.log(patternDetectionCommand + `"${sequencesPath} ${patternsPath} ${getItemConstraints()}"`)
    return new Promise(function (resolve, reject) {
        exec(patternDetectionCommand + `"${sequencesPath} ${patternsPath} ${getItemConstraints()}"`, (err, stdout, stderr) => {
            if (!err) {
                console.log(stdout)
                resolve(commit)
            }
            else {
                reject(err)
            }
        })
    })
}

function getProjectName() {
    return repo.match("[\\w\\.]+(?=.git)")[0]
}

function getItemConstraints() {
    return ["Store-src/store.js-8-164"]
}

run()
