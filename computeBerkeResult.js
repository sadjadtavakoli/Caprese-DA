const fs = require('fs');
const constants = require('./constants.js');

// Step2 keep a map of each function's object body. Each item has an ID, name, and a list of relationships. 
// relationships are basically the list of parents IDs. 
let functionsObjectList = {};

function computeBerkeResult(changes) {
    // console.log(" = = = Compute Impact-set = = = ");
    let impactSet = new Map()

    setChangeSetRelations(changes)

    intrepretDAResult(changes, impactSet);

    intrepretFPData(impactSet);

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

        let aFP = a['FP-score'] || 0;
        let bFP = b['FP-score'] || 0;
        if (aFP - bFP != 0) {
            return bFP - aFP;
        }

        let aDA = a['DA-antecedents'] || [];
        let bDA = b['DA-antecedents'] || [];
        return bDA.length - aDA.length;
    });
    fs.writeFileSync(constants.Berke_RESULT_PATH, JSON.stringify(sortableImpactSet));
}

function intrepretDAResult(changes, impactSet) {
    let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH));
    let keyMap = dependenciesData['keyMap'];
    for (let changedFucntion of changes) {
        let dependencies = dependenciesData[changedFucntion];
        if (dependencies == undefined) {
            dependencies = dependenciesData[anonymouseName(changedFucntion)];
        }

        if (dependencies != undefined) {
            for (let dependency of dependencies['impacted']) {
                addDAImpactSet(keyMap[dependency], changedFucntion);
            }
        }
    }

    function addDAImpactSet(item, antecedent) {
        // Step1 keep each of these nodes relation with the changedFunction 

        if (!isIncluded(changes, item)) {
            setRelations(item, antecedent)
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

function intrepretFPData(impactSet) {
    let FPimapctSet = JSON.parse(fs.readFileSync(constants.FP_RESULT_PATH));
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");
    for (let impacted in FPimapctSet) {
        let info = FPimapctSet[impacted];
        if (!removed.includes(impacted)) {
            setFPImpactSetRelations(impacted, info['FP-antecedents'])
            if (impactSet.has(impacted)) {
                impactSet.set(impacted, { ...impactSet.get(impacted), ...info });
            } else if (impactSet.has(anonymouseName(impacted))) {
                impactSet.set(impacted, { ...impactSet.get(anonymouseName(impacted)), ...info });
                impactSet.delete(anonymouseName(impacted))
            } else {
                impactSet.set(impacted, info);
            }
        }
    }
}

function isIncluded(changes, item) {
    return changes.some(changedItem =>
        changedItem == item || anonymouseName(changedItem) == item)
}
function anonymouseName(name) {
    return name.replace(/((?![.])([^-])*)/, "arrowAnonymousFunction");
}


function setChangeSetRelations(changeSet) {
    for (let i = 0; i < changeSet.length; i++) {
        for (let j = i + 1; j < changeSet.length; j++) {
            setRelations(changeSet[i], changeSet[j])
        }
    }
}

function setRelations(item1, item2) {
    let item1_brokenName = item1.split('-')
    let item2_brokenName = item2.split('-')
    if (item1_brokenName[1] == item2_brokenName[1]) {
        let item1_beginning = parseInt(item1_brokenName[2])
        let item1_end = parseInt(item1_brokenName[3])

        let item2_beginning = parseInt(item2_brokenName[2])
        let item2_end = parseInt(item2_brokenName[3])

        if (item1_beginning <= item2_beginning && item1_end >= item2_end) {
            let item1_object = getFunctionObject(item1)
            let item2_object = getFunctionObject(item2)
            item2_object['parents'].push(item1_object['id'])
            functionsObjectList[item2] = item2_object

        } else if (item2_beginning <= item1_beginning && item2_end >= item1_end) {
            let item1_object = getFunctionObject(item1)
            let item2_object = getFunctionObject(item2)
            item1_object['parents'].push(item2_object['id'])
            functionsObjectList[item1] = item1_object
        }
    }
}

function getFunctionObject(f) {
    if (functionsObjectList[f]) {
        return functionsObjectList[f]
    }

    let object = { "id": Object.keys(functionsObjectList).length, "parents": [] }
    functionsObjectList[f] = object
    return object
}

function setFPImpactSetRelations(impacted, antecedents){
    for(let list of antecedents){
        for(let antecedent of list){
            setRelations(antecedent, impacted)    
        }
    }

}
module.exports = { computeBerkeResult }