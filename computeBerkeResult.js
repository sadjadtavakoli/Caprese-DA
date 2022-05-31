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

    let sortableImpactSet = [];
    for (var item of impactSet) {
        sortableImpactSet.push({...{"consequent":item[0]}, ...item[1]});
    }

    sortableImpactSet.sort(function (a, b) {
        if ((a['DA-antecedents'] && !b['DA-antecedents'])) {
            return -1;
        }
        if (b['DA-antecedents'] && !a['DA-antecedents']) {
            return 1;
        }
        if (a['FP-antecedents'] && !b['FP-antecedents']) {
            return -1;
        }
        if (b['FP-antecedents'] && !a['FP-antecedents']) {
            return 1;
        }

        let aFP = a['FP-score'] || { 'FP-score': 0 };
        let bFP = b['FP-score'] || { 'FP-score': 0 };
        if (aFP['FP-score'] - bFP['FP-score'] != 0) {
            return bFP['FP-score'] - aFP['FP-score'];
        }

        let aDA = a['DA-antecedents']|| { 'DA-antecedents': [] };
        let bDA = b['DA-antecedents'] || {'DA-antecedents': [] };
        return bDA.length - aDA.length;
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
                addDAImpactSet(keyMap[dependency], changedFucntion);
            }

            for (let test of dependencies['tests']) {
                addDAImpactSet(keyMap[test], changedFucntion);

            }
        }
    }

    function addDAImpactSet(item, antecedent) {
        if (!changes.includes(item)) {
            if (impactSet.has(item) && impactSet.get(item)['DA-antecedents']) {
                impactSet.get(item)['DA-antecedents'].push(antecedent);
            }
            else {
                impactSet.set(item, { 'DA-antecedents': [antecedent] });
            }
        }
    }
}

function intrepretFPData(changes, impactSet) {
    // console.log(" ... FP result intrepration ... ");

    let patterns = fs.readFileSync(constants.PATTERNS_PATH).toString();
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");

    patterns = patterns.split(",");
    patterns.pop()
    for (let pattern of patterns) {
        let sequence = pattern.split(" -1:")[0];
        let probability = pattern.split(" -1:")[1].split(" ")[0];
        let support = pattern.split(" -1:")[1].split(" ")[1];
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
                if (!scores['FP-score'] || (scores['FP-score'] && newScore > scores['FP-score'])) {
                    scores = { 'FP-score': newScore, "support": support, 'FP-antecedents': [intersections] };
                } else if (newScore == scores['FP-score']) {
                    if (!scores['FP-antecedents'].includes(intersections)) {
                        scores['FP-antecedents'].push(intersections);
                    }
                }
                impactSet.set(transaction, scores); // @TODO we are ignoring number of items included in this change-sets in our result ordering
            } else {
                impactSet.set(transaction, { 'FP-score': newScore, 'support': support, 'FP-antecedents': [intersections] }); // @TODO we are ignoring number of items included in this change-sets in our result ordering
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