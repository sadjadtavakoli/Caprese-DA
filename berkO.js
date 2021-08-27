const path = require('path');
const exec = require('child_process').exec;
const constants = require('./constants.js')
let INITIALIZED_REPO = constants.REPO_URL
let INITIALIZED_COMMIT = constants.SEED_COMMIT;


// --nodeprof.ExcludeSource=keyword1,keyword2
function run() {

    console.log(" * * * * * * * * * * * \n * * * *  Srart! * * * \n * * * * * * * * * * * \n")
    console.log(constants.DA_COMMAND)
    runDynamicAnalysis("").then(()=>{
        console.log("DONE!")
    })
    
    // if (INITIALIZED_COMMIT && !argRepo) {
    //     pullAndCheckoutProject(INITIALIZED_COMMIT)
    //         .then(runDynamicAnalysis)
    //         .then(runRefDiff)
    //         .then(runClasp)
    //         .catch((err) => {
    //             console.log(err)
    //         })
    // } else {
    //     getHeadCommit()
    //         .then(pullAndCheckoutProject)
    //         .then(runDynamicAnalysis)
    //         .then(runRefDiff)
    //         .then(runClasp)
    //         .catch((err) => {
    //             console.log(err)
    //         })
    // }
}

function getHeadCommit() {
    const getHeadCommand = "cd " + constants.REPO_PATH + ' ; git rev-parse HEAD'

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
    const projectCloneCommand = "cd " + constants.PROJECTS_PATH + " ; git clone " + constants.REPO_URL
    const pullAndCheckoutCommand = projectCloneCommand + " ; cd " + constants.PROJECT_NAME + " ; git fetch -a ; git checkout " + commit
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
    return new Promise(function (resolve, reject) {
        exec(constants.REFDIFF_COMMAND + `"${constants.REPO_URL} ${commit} ${constants.SEQUENCES_PATH} ${constants.REPO_DIGGING_DEPTH}"`, (err, stdout, stderr) => {
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
    return new Promise(function (resolve, reject) {
        exec(constants.CLASP_COMMAND + `"${constants.SEQUENCES_PATH} ${constants.PATTERNS_PATH} ${getItemConstraints()}"`, (err, stdout, stderr) => {
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

function getItemConstraints() {
    return ["Store-src/store.js-8-164"]
}

run()
