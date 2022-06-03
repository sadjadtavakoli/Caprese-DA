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
        sortableImpactSet.push({ ...{ "consequent": item[0] }, ...item[1] });
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

        let aDA = a['DA-antecedents'] || { 'DA-antecedents': [] };
        let bDA = b['DA-antecedents'] || { 'DA-antecedents': [] };
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
            if (impactSet.has(item)) {
                let imapctedItem = impactSet.get(item)
                if (imapctedItem['DA-antecedents']) {
                    imapctedItem['DA-antecedents'].push(antecedent);
                } else {
                    imapctedItem['DA-antecedents'] = [antecedent];
                }
            } else {
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
        let confidence = parseFloat(pattern.split(" -1:")[1].split(" ")[0]);
        let support = pattern.split(" -1:")[1].split(" ")[1];
        let functions = sequence.trim().split(" ").filter(value => !removed.includes(value));
        let intersections = functions.filter(value => changes.includes(value));
        let impactedFunctions = functions.filter(value => !changes.includes(value));

        for (let impacted of impactedFunctions) {
            if (impactSet.has(impacted)) {
                let imapctedItem = impactSet.get(impacted);
                if (!imapctedItem['FP-score'] || (imapctedItem['FP-score'] && confidence > imapctedItem['FP-score'])) {
                    imapctedItem['FP-score'] = confidence
                    imapctedItem["support"] = support
                    imapctedItem['FP-antecedents'] = [intersections]
                } else if (confidence == imapctedItem['FP-score']) {
                    addToList(imapctedItem['FP-antecedents'], intersections)
                }
                impactSet.set(impacted, imapctedItem); // @TODO we are ignoring number of items included in this change-sets in our result ordering
            } else {
                impactSet.set(impacted, { 'FP-score': confidence, 'support': support, 'FP-antecedents': [intersections] }); // @TODO we are ignoring number of items included in this change-sets in our result ordering
            }
        }
    }
}

function addToList(listOflists, list2) {
    for (let list of listOflists) {
        if (list.length > list2.length) {
            if (list2.every(item => list.includes(item))) {
                return
            }
        }else{
            if(list.every(item => list2.includes(item))){
                return
            }
        }
    }
    listOflists.push(list2)
}

module.exports = { computeBerkeResult, intrepretFPData, sortAndReport }