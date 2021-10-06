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

function computeCommitChanges(commit) {
    return new Promise(function (resolve, reject) {
        exec(constants.REFDIFF_COMMAND + `"${constants.REPO_URL} ${commit} ${constants.CURRENT_CHANGES_PATH} ${constants.MAPPINGS_PATH} 0"`, (err, stdout, stderr) => {
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
                // console.log(stdout)
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

    let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH))
    let mappings = JSON.parse(fs.readFileSync(constants.MAPPINGS_PATH))
    let keyMap = dependenciesData['keyMap']
    // begin with our changes
    for (const change of changes) {
        let dependencies = dependenciesData[change]
        if (dependencies != undefined) {
            for (const dependency of dependencies['callers']) {
                let key = mappings[keyMap[dependency]]
                if (key == undefined) key = keyMap[dependency]
                impactSet.set(key, ['DA'])
            }
            for (const test of dependencies['tests']) {
                let key = mappings[keyMap[test]]
                if (key == undefined) key = keyMap[test]
                impactSet.set(key, ['DA - Test'])
            }
        }
    }
    let patterns = fs.readFileSync(constants.PATTERNS_PATH).toString()
    patterns = patterns.split(",")
    // console.log("* * * * * * * * * * patterns * * * * * * * * * *")
    // console.log(patterns)

    // console.log("* * * * * * * * * * changes * * * * * * * * * *")
    // console.log(changes)

    let impactSetBySequences = []

    for (let pattern of patterns) {
        let sequence = pattern.split(":")[0]
        let itemSets = sequence.split(" -1 ")
        let alreadyFound = false
        // console.log("* * * * * * * * * * itemSets * * * * * * * * * *")
        // console.log(itemSets)

        for (let itemSet of itemSets) {

            // console.log(" = = = = = = = single itemSet = = = = = = = = ")
            // console.log(itemSet)
            const filteredChanges = changes.filter(value => itemSet.includes(value));
            // console.log(" - - - - - - - Filtered Changes - - - - - - - -")
            // console.log(filteredChanges)

            if (alreadyFound || filteredChanges.length) {
                // console.log("√ Added")
                impactSetBySequences.push({ 'itemset': itemSet, 'score': filteredChanges.length })
                // console.log(changes)
                // console.log("injaee alan besmelah")
                // console.log(filteredChanges)
                alreadyFound = true
            }

        }
    }

    // impactSetBySequences = new Set(impactSetBySequences)
    // console.log("* * * * * * * * * impactSetBySequences * * * * * * * * * *")
    // console.log(impactSetBySequences)
    for (let itemSet of impactSetBySequences) {
        let items = itemSet['itemset'].trim().split(" ")
        items.pop()
        items = items.filter(item => changes.indexOf(item) == -1)
        for (let item of items) {
            if (impactSet.has(item)) {
                if (impactSet.get(item)['FP'])
                    impactSet.get(item)['FP'] += itemSet['score']
                else {
                    impactSet.get(item)['FP'] = itemSet['score']
                }
            }
            else {
                impactSet.set(item, { 'FP': itemSet['score'] })
            }

        }
    }

    console.log("* * * * * * * * * impactSet * * * * * * * * * ")
    console.log(impactSet)
}

function getItemConstraints() {
    // console.log("* * * * * * * * * changes * * * * * * * * * ")
    // console.log(changes)
    return changes
}

run()
