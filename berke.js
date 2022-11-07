const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const constants = require('./constants.js');
const { computeBerkeResult, computeBerkeResultNoDA } = require("./computeBerkeResult");

let changeSet = []

if (!fs.existsSync(constants.DATA_PATH)) {
    fs.mkdirSync(constants.DATA_PATH, {
        recursive: true
    });
}

if (process.argv[1].endsWith(path.basename(__filename))) {
    runBerke(constants.SEED_COMMIT)
}

async function runBerke(commit) {
    if (!commit) commit = await getCurrentCommit()
    await computeCommitChanges(commit)
    await getParentCommit(commit)
    await checkoutProject(commit)
    await runRefDiff(commit)
    await runDynamicAnalysis()
    await runFP()
    computeBerkeResult(getChangeSet())
}

async function evaluationGetMainData(commit) {
    if (!commit) commit = await getCurrentCommit()
    await checkoutProject(commit)
    await runRefDiff(commit)
    await runDynamicAnalysis()
}

async function evaluationAnalyzer(changes) {
    changeSet = changes
    await runFP()
    computeBerkeResult(changes)
}

async function tempFP(changes){
    changeSet = changes
    await runFP()
    computeBerkeResultNoDA(changes)

}

async function getParentCommit(commit) {
    console.log(" = = = Get Parent Commit = = = ")
    const getParrentCommand = `cd ${constants.REPO_PATH} ; git rev-parse ${commit}^`
    return runCommand(getParrentCommand)
}

async function getCurrentCommit() {
    console.log(" = = = Get Current Commit = = = ")
    const getOriginCommand = `cd ${constants.REPO_PATH} ; git rev-parse origin`
    return runCommand(getOriginCommand)
}

async function checkoutProject(commit) {
    console.log(" = = = Checkout Project = = = ")
    const checkoutCommand = `cd ${constants.REPO_PATH} ; git checkout ${commit}`
    return runCommand(checkoutCommand)
}

async function runDynamicAnalysis() {
    console.log(" = = = Run Dynamic Anlaysis = = = ")
    return runCommand(constants.DA_COMMAND, true)
}

async function runRefDiff(commit, diggingDepth = constants.REPO_DIGGING_DEPTH, resultPath = constants.SEQUENCES_PATH) {
    console.log(` = = = Run RefDiff with depth ${diggingDepth} = = = `)
    let refDiffCommand = `${constants.REFDIFF_COMMAND}"${constants.REPO_URL} ${commit} ${resultPath} ${constants.REMOVED_PATH} ${diggingDepth} ${constants.MAPPINGS_PATH} ${constants.FP_EXCLUDED_DIRS}"`;
    return runCommand(refDiffCommand, true)
}

async function computeCommitChanges(commit) {
    console.log(" = = = Get Commit's Changes = = = ")
    return runRefDiff(commit, 0, constants.CURRENT_CHANGES_PATH)
}

async function runFP() {
    console.log(" = = = Run FP = = = ")
    let FPCommand = `${constants.FP_COMMAND}"${constants.SEQUENCES_PATH} ${constants.FP_RESULT_PATH} ${getChangeSet()}"`
    return runCommand(FPCommand)
}

function runCommand(command, logReport = false) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (!err) {
                resolve(stdout.trimEnd())
                if (logReport) console.log(stdout.trimEnd())
            } else {
                reject(err)
                if (logReport) console.log(stderr.trimEnd())
            }
        })
    })
}

function getChangeSet() {
    if (!changeSet.length)
        changeSet = fs.readFileSync(constants.CURRENT_CHANGES_PATH).toString().trim().split(" ")
    return changeSet
}

module.exports = { evaluationAnalyzer, evaluationGetMainData, tempFP, runDynamicAnalysis }