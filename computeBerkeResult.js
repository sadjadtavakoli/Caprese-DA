const fs = require('fs');
const constants = require('./constants.js');


function computeBerkeResult(changes) {
    // console.log(" = = = Compute Impact-set = = = ");
    let impactSet = new Map()

    intrepretDAResult(changes, impactSet);

    intrepretFPData(changes, impactSet);

    sortAndReport(impactSet);
}

function sortAndReport(impactSet) {
    // console.log(" ... Saving result ... ");

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
    fs.writeFileSync(constants.Berke_RESULT_PATH, JSON.stringify(sortableImpactSet));
}

function intrepretDAResult(changes, impactSet) {
    // console.log(" ... DA result intrepration ... ");

    let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH));
    let keyMap = dependenciesData['keyMap'];
    for (let changedFucntion of changes) {
        let dependencies = dependenciesData[changedFucntion];
        if (dependencies == undefined) {
            let unknownKey = changedFucntion.replace(/((?![.])([^-])*)/, "arrowAnonymousFunction");
            dependencies = dependenciesData[unknownKey];
        }

        if (dependencies != undefined) {
            for (let dependency of dependencies['callers']) {
                addDAImpactSet(keyMap[dependency]);
            }

            for (let test of dependencies['tests']) {
                addDAImpactSet(keyMap[test], true);

            }
        }
    }

    function addDAImpactSet(item, isTestFunction) {
        if (!changes.includes(item)) {
            if (impactSet.has(item) && impactSet.get(item)['DA']) {
                impactSet.get(item)['DA']['score'] = impactSet.get(item)['DA']['score'] + 1;
            }
            else {
                let scoreValue = {};
                scoreValue['DA'] = { 'score': 1 };
                impactSet.set(item, scoreValue);
            }
            if (isTestFunction)
                impactSet.get(item)['DA']['test'] = isTestFunction;
        }
    }
}

function intrepretFPData(changes, impactSet) {
    // console.log(" ... FP result intrepration ... ");

    let patterns = fs.readFileSync(constants.PATTERNS_PATH).toString();
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");

    patterns = patterns.split(",");
    for (let pattern of patterns) {
        let sequence = pattern.split(" -1:")[0];
        let probability = pattern.split(" -1:")[1];
        /*
        Keep the number of change-set items included in that particular itemset
        */
        let transactions = sequence.trim().split(" ").filter(value => !removed.includes(value));
        let intersections = stringfyIntersection(transactions.filter(value => changes.includes(value)));
        let validTransactions = transactions.filter(value => !changes.includes(value));
        for (let transaction of validTransactions) {
            let newScore = probability;
            if (impactSet.has(transaction)) {
                let scores = impactSet.get(transaction);
                if (!scores['FP'] || (scores['FP'] && newScore > scores['FP']['score'])) {
                    scores['FP'] = { 'score': newScore, 'antecedents': [intersections] };
                } else if (newScore == scores['FP']['score']) {
                    if (!scores['FP']['antecedents'].includes(intersections)) {

                        scores['FP']['antecedents'].push(intersections);
                    }
                }
                impactSet.set(transaction, scores); // @TODO we are ignoring number of items included in this change-sets in our result ordering
            } else {
                impactSet.set(transaction, { 'FP': { 'score': newScore, 'antecedents': [intersections] } }); // @TODO we are ignoring number of items included in this change-sets in our result ordering
            }
        }
    }
}
function stringfyIntersection(intersections) {
    let res = "";
    for (let intersection of intersections) {
        res += ", " + intersection;
    }
    return res.substring(2);
}

module.exports = { computeBerkeResult, intrepretFPData, sortAndReport }