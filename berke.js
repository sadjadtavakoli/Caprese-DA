const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const constants = require('./constants.js');
const { computeBerkeResult, getDAResult } = require("./computeBerkeResult");

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
    return Promise.resolve()
        .then(() => {
            if (initialized_commit) return computeCommitChanges(initialized_commit)
            return getCurrentCommit()
                .then((commit) => {
                    return computeCommitChanges(commit)
                })
        })
        .then(getParentCommit)
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
        // .then(runRefDiff)
        // .then(runDynamicAnalysis)
        .catch((err) => {
            console.log(err)
        })
}

function evaluationAnalyzer(changes) {
    changeSet = changes
    return runClasp()
        .then(() => getDAResult(changes))
        .then(getSecondLayer)
        .then(() => computeBerkeResult(changes))
        .catch((err) => {
            console.log(err)
        })
}

function getSecondLayer(changes){
    console.log(changes)
    console.log(" = = = Run Clasp Second Layer= = = ")
    return new Promise((resolve, reject) => {
        if(changes.length){
            exec(`${constants.CLASP_COMMAND}"${constants.SEQUENCES_PATH} ${constants.FP_RESULT_PATH+"2.json"} ${changes}"`, (err, stdout, stderr) => {
                if (!err) {
                    resolve()
                }
                else {
                    reject(err)
                }
            })
        }else{
            resolve()
        }
    })
}
function getParentCommit(commit) {
    console.log(" = = = Get Parent Commit = = = ")
    const getParrentCommand = `cd ${constants.REPO_PATH} ; git rev-parse ${commit}^`
    return new Promise((resolve, reject) => {
        exec(getParrentCommand, (err, stdout, stderr) => {
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

function runDynamicAnalysis() {
    console.log(" = = = Run Dynamic Anlaysis = = = ")
    return new Promise((resolve, reject) => {
        exec(constants.DA_COMMAND, (err, stdout, stderr) => {
            if (!err) {
                resolve()
            }
            else {
                reject(err)
            }
        })
    })
}

function runRefDiff(commit, diggingDepth = constants.REPO_DIGGING_DEPTH, resultPath = constants.SEQUENCES_PATH) {
    console.log(` = = = Run RefDiff with depth ${diggingDepth} = = = `)
    return new Promise((resolve, reject) => {
        exec(`${constants.REFDIFF_COMMAND}"${constants.REPO_URL} ${commit} ${resultPath} ${constants.REMOVED_PATH} ${diggingDepth} ${constants.MAPPINGS_PATH} ${constants.EXCLUDED}"`, (err, stdout, stderr) => {
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
    console.log(" = = = Get Commit's Changes = = = ")
    return runRefDiff(commit, 0, constants.CURRENT_CHANGES_PATH)
}

function runClasp() {
    console.log(" = = = Run Clasp = = = ")
    return new Promise((resolve, reject) => {
        exec(`${constants.CLASP_COMMAND}"${constants.SEQUENCES_PATH} ${constants.FP_RESULT_PATH} ${getChangeSet()}"`, (err, stdout, stderr) => {
            if (!err) {
                resolve()
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

module.exports = { evaluationAnalyzer, evaluationGetMainData }