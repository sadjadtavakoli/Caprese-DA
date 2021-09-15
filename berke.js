const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const constants = require('./constants.js')

let INITIALIZED_COMMIT = constants.SEED_COMMIT;

let changes = []

// --nodeprof.ExcludeSource=keyword1,keyword2
function run() {

    console.log(" * * * * * * * * * * * \n * * * *  Srart! * * * \n * * * * * * * * * * * \n")


    if (!fs.existsSync(constants.DATA_PATH)) {
        fs.mkdirSync(constants.DATA_PATH, {
            recursive: true
        });
    }
    // runBerke()

    cloneProject()
        .then(() => {
            if (INITIALIZED_COMMIT) return computeCurrentChanges(INITIALIZED_COMMIT)
            return getCurrentCommit().then((commit) => {
                return computeCurrentChanges(commit)
            })
        })
        .then(() => {
            if (INITIALIZED_COMMIT) return getParentCommit(INITIALIZED_COMMIT)
            return getParentCommit('origin')

        })
        .then(checkoutProject)
        .then(runDynamicAnalysis)
        .then(runRefDiff)
        .then(runClasp)
        .then(() => {
            console.log("INITIALIZED DONE!")
        })
        .catch((err) => {
            console.log(err)
        })
}

function getParentCommit(commit) {
    const getOriginCommand = "cd " + constants.REPO_PATH + ` ; git rev-parse ${commit}^`
    return new Promise(function (resolve, reject) {
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
    const getOriginCommand = "cd " + constants.REPO_PATH + ` ; git rev-parse origin`
    return new Promise(function (resolve, reject) {
        exec(getOriginCommand, (err, stdout, stderr) => {
            if (!err) {
                resolve(stdout.trimEnd())
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
    const checkoutCommand = "cd " + constants.REPO_PATH + " ; git checkout " + commit
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
                console.log(stderr)
                reject(err)
            }
        })
    })

}

function computeCurrentChanges(commit) {
    return new Promise(function (resolve, reject) {
        exec(constants.REFDIFF_COMMAND + `"${constants.REPO_URL} ${commit} ${constants.CURRENT_CHANGES_PATH} 0"`, (err, stdout, stderr) => {
            if (!err) {
                changes = fs.readFileSync(constants.CURRENT_CHANGES_PATH).toString().split(" ")
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

function runBerke() {
    let impactSet = new Map()

    let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH))
    let keyMap = dependenciesData['keyMap']
    // begin with our changes
    for (const change of changes) {
        let dependencies = dependenciesData[change]['callers']
        for (const dependency of dependencies) {
            impactSet.set(keyMap[dependency], ['DA'])
        }
    }

    let patterns = fs.readFileSync(constants.PATTERNS_PATH).toString()
    patterns = patterns.split(",")
    let impactSetBySequences = []

    for (let pattern of patterns) {
        let sequence = pattern.split(":")[0]
        let itemSets = sequence.split(" -1")
        let alreadyFound = false
        for (let itemSet of itemSets) {
            if (alreadyFound || changes.some(v => itemSet.includes(v))) {
                impactSetBySequences = impactSetBySequences.concat(itemSet.trim().split(" "))
            }
        }
    }

    impactSetBySequences = new Set(impactSetBySequences)
    for (let item of impactSetBySequences) {
        if (impactSet.has(item)) {
            impactSet.get(item).push('FS')
        }
        else {
            impactSet.set(item, ['FS'])
        }
    }

    console.log(impactSet)
}

function getItemConstraints() {
    return changes
}

run()
