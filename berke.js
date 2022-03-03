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
            console.log(" = = = Compute Current Changes = = = ")
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
    console.log(" = = = Get Parent Commit = = = ")
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
    console.log(" = = = Get Current Commit = = = ")
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
    console.log(" = = = Checkout Project = = = ")
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
    console.log(" = = = Run Dynamic Anlaysis = = = ")
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
    console.log(" = = = Run RefDiff = = = ")
    return new Promise(function (resolve, reject) {
        exec(constants.REFDIFF_COMMAND + `"${constants.REPO_URL} ${commit} ${constants.SEQUENCES_PATH} ${constants.REMOVED_PATH} ${constants.REPO_DIGGING_DEPTH} ${constants.MAPPINGS_PATH}"`, (err, stdout, stderr) => {
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
        exec(constants.REFDIFF_COMMAND + `"${constants.REPO_URL} ${commit} ${constants.CURRENT_CHANGES_PATH} ${constants.REMOVED_PATH} 0"`, (err, stdout, stderr) => {
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
    return new Promise(function (resolve, reject) {
        exec(constants.CLASP_COMMAND + `"${constants.SEQUENCES_PATH} ${constants.PATTERNS_PATH} ${constants.ITEMS_FREQUENCIES_PATH} ${getItemConstraints()}"`, (err, stdout, stderr) => {
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
    console.log(" = = = Final Report = = = ")
    let impactSet = new Map()

    /* 
    Read and organize Dynamic analysis recorded dependencies as ImpactSet 
    */
    let frequenciesData = JSON.parse(fs.readFileSync(constants.ITEMS_FREQUENCIES_PATH))
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");

    /* 
    Callers and tests of our current changes as potential impactSet items 
    */

    getItemConstraints();

    IntrepretDAResult();

    IntrepretFPData();

    let sortableImpactSet = [];
    // console.log(impactSet)
    for (var item of impactSet) {
        sortableImpactSet.push(item);
    }
    sortableImpactSet.sort(function(a, b){
        if(a[1]['DA'] && !b[1]['DA']){
            return 1
        }
        if(b[1]['DA'] && !a[1]['DA']){
            return 0
        }
        let aFP = a[1]['FP'] || 0
        let bFP = b[1]['FP'] || 0
        if(aFP - bFP != 0){
            return bFP - aFP 
        }
        let aDA = (a[1]['DA'] || 0) + (a[1]['DA-test'] || 0)
        let bDA = (b[1]['DA'] || 0) + (b[1]['DA-test'] || 0)
        return bDA - aDA 
        });

    // console.log("* * * * * * * * * impactSet * * * * * * * * * ")
    console.log(sortableImpactSet)

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

    function IntrepretDAResult(){
        let mappings = JSON.parse(fs.readFileSync(constants.MAPPINGS_PATH))
        let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH))
        let keyMap = dependenciesData['keyMap']
        for (const changedFucntion of changes) {
            let dependencies = dependenciesData[changedFucntion];
            if (dependencies == undefined) {
                let unknownKey = changedFucntion.replace(/((?![.])([^-])*)/, "arrowFunction");
                dependencies = dependenciesData[unknownKey];
            }
            if (dependencies != undefined) {
                for (const dependency of dependencies['callers']) {
                    let key = mappings[keyMap[dependency]];
                    if (key == undefined)
                        key = keyMap[dependency];
                    addImpactSet(key, 'DA', 1);
                }
                for (const test of dependencies['tests']) {

                    let key = mappings[keyMap[test]];
                    if (key == undefined)
                        key = keyMap[test];

                    addImpactSet(key, 'DA-test', 1);

                }
            }
        }
    }

    function IntrepretFPData() {
        let patterns = fs.readFileSync(constants.PATTERNS_PATH).toString();
        patterns = patterns.split(",");
        let impactedSequences = [];
        for (let pattern of patterns) {
            let sequence = pattern.split(" -1:")[0];
            let probability = pattern.split(" -1:")[1];
            /*
            Keep the number of change-set items included in that particular itemset
            */
            const filteredChangesCount = changes.filter(value => sequence.includes(value)).length;
            if (filteredChangesCount) {
                impactedSequences.push({ 'sequence': sequence, 'items-included': filteredChangesCount, 'probability': probability });
            }
        }

        /*
        Computes total score for each reported itemfrom frequent pattern detection.  
        */
        for (let impactedItem of impactedSequences) {
            let transactions = impactedItem['sequence'].trim().split(" ")
            for (let transaction of transactions) {
                if (changes.indexOf(transaction) == -1 && removed.indexOf(transaction) == -1) {
                    let power = 1 
                    if(impactedItem['items-included'] > 1) power = impactedItem['items-included']
                    addImpactSet(transaction, 'FP', parseFloat(impactedItem['probability']) * power) // @TODO we are ignoring number of items included in this change-sets in our result ordering
                }
            }
        }
    }
}

function getItemConstraints() {
    changes = fs.readFileSync(constants.CURRENT_CHANGES_PATH).toString().trim().split(" ")
    return changes
}

run()
