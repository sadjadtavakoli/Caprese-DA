const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const constants = require('./constants.js')

let INITIALIZED_COMMIT = constants.SEED_COMMIT;


// --nodeprof.ExcludeSource=keyword1,keyword2
function run() {

    console.log(" * * * * * * * * * * * \n * * * *  Srart! * * * \n * * * * * * * * * * * \n")
    console.log(constants.DA_COMMAND)


    if (!fs.existsSync(constants.DATA_PATH)) {
        fs.mkdirSync(constants.DATA_PATH, {
            recursive: true
        });
    }

    // runDynamicAnalysis("")

    if (INITIALIZED_COMMIT) {
        console.log("yes")
        cloneProject()
            .then(() => {
                return checkoutProject(INITIALIZED_COMMIT)
            })
            .then(runDynamicAnalysis)
            // .then(runRefDiff)
            // .then(runClasp)
            .then(() => {
                console.log("INITIALIZED DONE!")
            })
            .catch((err) => {
                console.log(err)
            })
    } else {
        console.log("no")
        cloneProject()
            .then(getHeadCommit)
            .then(runDynamicAnalysis)
            // .then(runRefDiff)
            // .then(runClasp)
            .then(() => {
                console.log("DONE!")
            })
            .catch((err) => {
                console.log(err)
            })

    }
}

function getHeadCommit() {
    const getHeadCommand = "cd " + constants.REPO_PATH + ' ; git checkout '+ constants.REPO_MAIN_BRANCH +' ; git pull ; git rev-parse HEAD'
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

function cloneProject() {
    const projectCloneCommand = "cd " + constants.DATA_PATH + " ; git clone " + constants.REPO_URL
    return new Promise(function (resolve, reject) {
        exec(projectCloneCommand, (err, stdout, stderr) => {
            resolve()
        })
    })
}

function checkoutProject(commit) {
    const checkoutCommand = "cd " + constants.REPO_PATH + " ; git fetch origin ; git checkout " + commit
    return new Promise(function (resolve, reject) {
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
