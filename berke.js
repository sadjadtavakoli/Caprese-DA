const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const constants = require('./constants.js')

let INITIALIZED_COMMIT = constants.SEED_COMMIT;

let changes = []

function run() {

    console.log(" * * * * * * * * * * * \n * * * *  Srart! * * * \n * * * * * * * * * * * \n")


    if (!fs.existsSync(constants.DATA_PATH)) {
        fs.mkdirSync(constants.DATA_PATH, {
            recursive: true
        });
    }
    cloneProject()
        .then(() => {
            if (INITIALIZED_COMMIT) return computeCommitChanges(INITIALIZED_COMMIT)
            return getCurrentCommit().then((commit) => {
                return computeCommitChanges(commit)
            })
        })
        .then(() => {
            if (INITIALIZED_COMMIT) return getParentCommit(INITIALIZED_COMMIT)
            return getParentCommit('origin')

        })
        .then(checkoutProject)
        .then(runRefDiff)
        .then(runDynamicAnalysis)
        .then(runClasp)
        .then(() => {
            runBerke()
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
    // const projectCloneCommand = "cd " + constants.DATA_PATH + " ; git clone " + constants.REPO_URL
    return new Promise(function (resolve, reject) {
        // exec(projectCloneCommand, (err, stdout, stderr) => {
        resolve()
        // })
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
    console.log(constants.DA_COMMAND)
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
        exec(constants.REFDIFF_COMMAND + `"${constants.REPO_URL} ${commit} ${constants.SEQUENCES_PATH} ${constants.MAPPINGS_PATH} ${constants.REPO_DIGGING_DEPTH}"`, (err, stdout, stderr) => {
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
    return new Promise(function (resolve, reject) {
        exec(constants.REFDIFF_COMMAND + `"${constants.REPO_URL} ${commit} ${constants.CURRENT_CHANGES_PATH} ${constants.MAPPINGS_PATH} 0"`, (err, stdout, stderr) => {
            if (!err) {
                changes = fs.readFileSync(constants.CURRENT_CHANGES_PATH).toString().trim().split(" ")
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
                resolve(commit)
            }
            else {
                reject(err)
            }
        })
    })
}

// Not Completed
function runBerke() {
    let impactSet = new Map()

    /* 
    Read and organize Dynamic analysis recorded dependencies as ImpactSet 
    */
    let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH))
    let mappings = JSON.parse(fs.readFileSync(constants.MAPPINGS_PATH))
    let keyMap = dependenciesData['keyMap']

    /* 
    Callers and tests of our current changes as potential impactSet items 
    */
    for (const change of getItemConstraints()) {
        let dependencies = dependenciesData[change]
        if (dependencies != undefined) {
            for (const dependency of dependencies['callers']) {
                let key = mappings[keyMap[dependency]]
                if (key == undefined) key = keyMap[dependency]
                addImpactSet(key, 'DA', 1)
            }
            for (const test of dependencies['tests']) {

                let key = mappings[keyMap[test]]
                if (key == undefined) key = keyMap[test]

                addImpactSet(key, 'DA-test', 1)

            }
        }
    }

    let impactSetBySequences = getCoChangesData();

    /*
        Computes total score for each reported itemfrom frequent pattern detection.  
    */
    for (let impactedItem of impactSetBySequences) {
        let transactions = impactedItem['sequence'].trim().split(" ")
        for (let transaction of transactions) {
            if (changes.indexOf(transaction) == -1) {
                addImpactSet(transaction, 'FP', parseFloat(impactedItem['probability'])) // @TODO we are ignoring number of items included in this change-sets in our result ordering
            }
        }
    }

    console.log("* * * * * * * * * impactSet * * * * * * * * * ")
    console.log(impactSet)

    function addImpactSet(item, value, score) {
        if (impactSet.has(item)) {
            if (impactSet.get(item)[value])
                impactSet.get(item)[value] += score
            else {
                impactSet.get(item)[value] = score
            }
        }
        else {
            let valueScore = {}
            valueScore[value] = score
            impactSet.set(item, valueScore)
        }
    }
}

/**
 *Read and organize Frequent patterns as ImpactSet 
 */
function getCoChangesData() {
    let patterns = fs.readFileSync(constants.PATTERNS_PATH).toString();
    patterns = patterns.split(",");

    let impactSetBySequences = [];

    for (let pattern of patterns) {
        let sequence = pattern.split(" -1:")[0];
        let probability = pattern.split(" -1:")[1];
        /*
        Keep the number of change-set items included in that particular itemset
        */
        const filteredChangesCount = changes.filter(value => sequence.includes(value)).length;

        if (filteredChangesCount) {
            impactSetBySequences.push({ 'sequence': sequence, 'items-included': filteredChangesCount, 'probability': probability });
        }
    }
    return impactSetBySequences;
}

function getItemConstraints() {
    changes = fs.readFileSync(constants.CURRENT_CHANGES_PATH).toString().trim().split(" ")
    return changes
}

run()
