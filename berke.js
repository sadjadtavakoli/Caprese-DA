const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const constants = require('./constants.js');
const { computeBerkeResult } = require("./computeBerkeResult");

let changeSet = []

if (!fs.existsSync(constants.DATA_PATH)) {
    fs.mkdirSync(constants.DATA_PATH, {
        recursive: true
    });
}

if (process.argv[1].endsWith(path.basename(__filename))) {
    runBerke(constants.SEED_COMMIT)
}

function runBerke(initialized_commit) {
    return ignite(initialized_commit).then(() => {
        if (initialized_commit) return getParentCommit(initialized_commit)
        return getParentCommit('origin')

    })
        .then(checkoutProject)
        .then(runRefDiff)
        .then(runDynamicAnalysis)
        .then(runClasp)
        .then(() => computeBerkeResult(getChangeSet()))
        .catch((err) => {
            console.log(err)
        })
}

function evaluationGetMainData(initialized_commit) {
    return checkoutProject(initialized_commit)
        .then(runRefDiff)
        .then(runDynamicAnalysis)
        .catch((err) => {
            console.log(err)
        })
}

function evaluationAnalyzer(initialized_commit, changes) {
    changeSet = changes
    // console.log("berke evaluation analyzer")
    return runClasp(initialized_commit)
        .then(() => computeBerkeResult(getChangeSet()))
        .catch((err) => {
            console.log(err)
        })
}

function ignite(initialized_commit) {
    if (initialized_commit) return computeCommitChanges(initialized_commit)
    return getCurrentCommit().then((commit) => {
        return computeCommitChanges(commit)
    })
}

function getParentCommit(commit) {
    console.log(" = = = Get Parent Commit = = = ")
    const getOriginCommand = `cd ${constants.REPO_PATH} ; git rev-parse ${commit}^`
    return new Promise((resolve, reject) => {
        exec(getOriginCommand, (err, stdout, stderr) => {
            if (!err) {
                resolve(stdout.trimEnd())
            } else {
                reject(err)
            }
        })
    })
}

function getCurrentCommit() {
    console.log(" = = = Get Current Commit = = = ")
    const getOriginCommand = `cd ${constants.REPO_PATH} ; git rev-parse origin`
    return new Promise((resolve, reject) => {
        exec(getOriginCommand, (err, stdout, stderr) => {
            if (!err) {
                resolve(stdout.trimEnd())
            } else {
                reject(err)
            }
        })
    })
}

function checkoutProject(commit) {
    console.log(" = = = Checkout Project = = = ")
    const checkoutCommand = `cd ${constants.REPO_PATH} ; git checkout ${commit}`
    return new Promise((resolve, reject) => {
        exec(checkoutCommand, (err, stdout, stderr) => {
            if (!err) {
                resolve(commit)
            } else {
                reject(err)
            }
        })
    })

}

function runDynamicAnalysis(commit) {
    console.log(" = = = Run Dynamic Anlaysis = = = ")
    return new Promise((resolve, reject) => {
        exec(constants.DA_COMMAND, (err, stdout, stderr) => {
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
    console.log(" = = = Run RefDiff = = = ")
    return new Promise((resolve, reject) => {
        exec(`${constants.REFDIFF_COMMAND}"${constants.REPO_URL} ${commit} ${constants.SEQUENCES_PATH} ${constants.REMOVED_PATH} ${constants.REPO_DIGGING_DEPTH} ${constants.MAPPINGS_PATH}"`, (err, stdout, stderr) => {
            if (!err) {
                resolve(commit)
            }
            else {
                reject(err)
            }
        })
    })

}

function computeCommitChanges(commit) {
    return new Promise((resolve, reject) => {
        exec(`${constants.REFDIFF_COMMAND}"${constants.REPO_URL} ${commit} ${constants.CURRENT_CHANGES_PATH} ${constants.REMOVED_PATH} 0"`, (err, stdout, stderr) => {
            if (!err) {
                resolve(commit)
            }
            else {
                console.log(stderr)
                reject(err)
            }
        })
    })

}

function runClasp(commit) {
    console.log(" = = = Run Clasp = = = ")
    return new Promise((resolve, reject) => {
        exec(`${constants.CLASP_COMMAND}"${constants.SEQUENCES_PATH} ${constants.PATTERNS_PATH} ${getChangeSet()}"`, (err, stdout, stderr) => {
            if (!err) {
                resolve(commit)
            }
            else {
                reject(err)
            }
        })
    })
}

function getChangeSet() {
    if (!changeSet.length)
        changeSet = fs.readFileSync(constants.CURRENT_CHANGES_PATH).toString().trim().split(" ")
    return changeSet
}
module.exports = { getParentCommit, evaluationAnalyzer, evaluationGetMainData }