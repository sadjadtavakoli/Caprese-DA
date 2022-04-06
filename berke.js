const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
const constants = require('./constants.js');
let INITIALIZED_COMMIT = constants.SEED_COMMIT;

let changes = []

if (!fs.existsSync(constants.DATA_PATH)) {
    fs.mkdirSync(constants.DATA_PATH, {
        recursive: true
    });
}

if (process.argv[1].endsWith(path.basename(__filename))) {
    runBerke(INITIALIZED_COMMIT)
}

function runBerke(initialized_commit) {
    return getChanges(initialized_commit).then(() => {
        if (initialized_commit) return getParentCommit(initialized_commit)
        return getParentCommit('origin')

    })
        .then(checkoutProject)
        .then(runRefDiff)
        .then(runDynamicAnalysis)
        .then(runClasp)
        .then(() => computeBerkeResult())
        .catch((err) => {
            console.log(err)
        })
}

function getChanges(initialized_commit) {
        if (initialized_commit) return computeCommitChanges(initialized_commit)
        return getCurrentCommit().then((commit) => {
            return computeCommitChanges(commit)
        })
}

function getParentCommit(commit) {
    console.log(" = = = Get Parent Commit = = = ")
    const getOriginCommand = `cd ${constants.REPO_PATH} ; git rev-parse ${commit}^`
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
    const getOriginCommand = `cd ${constants.REPO_PATH} ; git rev-parse origin`
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

function checkoutProject(commit) {
    console.log(" = = = Checkout Project = = = ")
    const checkoutCommand = `cd ${constants.REPO_PATH} ; git checkout ${commit}`
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
    return new Promise(function (resolve, reject) {
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
    return new Promise(function (resolve, reject) {
        exec(`${constants.CLASP_COMMAND}"${constants.SEQUENCES_PATH} ${constants.PATTERNS_PATH} ${getItemConstraints()}"`, (err, stdout, stderr) => {
            if (!err) {
                resolve(commit)
            }
            else {
                reject(err)
            }
        })
    })
}

function getItemConstraints() {
    changes = fs.readFileSync(constants.CURRENT_CHANGES_PATH).toString().trim().split(" ")
    return changes
}

function computeBerkeResult(isTest = false) {
    console.log(" = = = Compute Impact-set = = = ")
    let impactSet = new Map()
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");

    getItemConstraints();

    intrepretDAResult();

    intrepretFPData();

    if (isTest) {
        fs.writeFileSync(constants.Berke_RESULT_PATH, JSON.stringify(impactSet))
    }

    sortAndReport();

    function sortAndReport() {

        let sortableImpactSet = [];
        for (var item of impactSet) {
            sortableImpactSet.push(item);
        }

        sortableImpactSet.sort(function (a, b) {
            if ((a[1]['DA'] && !b[1]['DA'])) {
                return -1;
            }
            if (b[1]['DA'] && !a[1]['DA']) {
                return 1;
            }
            if (a[1]['FP'] && !b[1]['FP']) {
                return -1;
            }
            if (b[1]['FP'] && !a[1]['FP']) {
                return 1;
            }

            let aFP = a[1]['FP'] || { 'score': 0 };
            let bFP = b[1]['FP'] || { 'score': 0 };
            if (aFP['score'] - bFP['score'] != 0) {
                return bFP['score'] - aFP['score'];
            }

            let aDA = a[1]['DA'] || { 'score': 0 };
            let bDA = b[1]['DA'] || { 'score': 0 };
            return bDA['score'] - aDA['score'];
        });
        fs.writeFileSync(constants.Berke_RESULT_PATH, JSON.stringify(sortableImpactSet))
    }


    function intrepretDAResult() {
        let mappings = JSON.parse(fs.readFileSync(constants.MAPPINGS_PATH))
        let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH))
        let keyMap = dependenciesData['keyMap']
        for (let changedFucntion of changes) {
            let dependencies = dependenciesData[changedFucntion];
            if (dependencies == undefined) {
                let unknownKey = changedFucntion.replace(/((?![.])([^-])*)/, "arrowFunction");
                dependencies = dependenciesData[unknownKey];
            }

            if (dependencies != undefined) {
                for (let dependency of dependencies['callers']) {
                    let key = mappings[keyMap[dependency]];
                    if (key == undefined)
                        key = keyMap[dependency];
                    addDAImpactSet(key);
                }

                for (let test of dependencies['tests']) {
                    let key = mappings[keyMap[test]];
                    if (key == undefined)
                        key = keyMap[test];
                    addDAImpactSet(key, true);

                }
            }
        }
    }

    function addDAImpactSet(item, isTestFunction) {
        if (impactSet.has(item) && impactSet.get(item)['DA']) {
            impactSet.get(item)['DA']['score'] = impactSet.get(item)['DA']['score'] + 1
        }
        else {
            let scoreValue = {}
            scoreValue['DA'] = { 'score': 1 }
            impactSet.set(item, scoreValue)
        }
        if (isTestFunction)
            impactSet.get(item)['DA']['test'] = isTestFunction
    }

    function intrepretFPData() {
        let patterns = fs.readFileSync(constants.PATTERNS_PATH).toString();
        patterns = patterns.split(",");
        for (let pattern of patterns) {
            let sequence = pattern.split(" -1:")[0];
            let probability = pattern.split(" -1:")[1];
            /*
            Keep the number of change-set items included in that particular itemset
            */
            let transactions = sequence.trim().split(" ").filter(value => !removed.includes(value))
            let intersections = stringfyIntersection(transactions.filter(value => changes.includes(value)));
            let validTransactions = transactions.filter(value => !changes.includes(value));
            for (let transaction of validTransactions) {
                let newScore = probability
                if (impactSet.has(transaction)) {
                    let scores = impactSet.get(transaction)
                    if (!scores['FP'] || (scores['FP'] && newScore > scores['FP']['score'])) {
                        scores['FP'] = { 'score': newScore, 'antecedents': [intersections] }
                    } else if (newScore == scores['FP']['score']) {
                        if (!scores['FP']['antecedents'].includes(intersections)) {

                            scores['FP']['antecedents'].push(intersections)
                        }
                    }
                    impactSet.set(transaction, scores) // @TODO we are ignoring number of items included in this change-sets in our result ordering
                } else {
                    impactSet.set(transaction, { 'FP': { 'score': newScore, 'antecedents': [intersections] } }) // @TODO we are ignoring number of items included in this change-sets in our result ordering
                }
            }
        }
    }

    function stringfyIntersection(intersections) {
        let res = ""
        for (let intersection of intersections) {
            res += ", " + intersection
        }
        return res.substring(2)
    }

}

module.exports = { runClasp, computeBerkeResult, getItemConstraints, runBerke }