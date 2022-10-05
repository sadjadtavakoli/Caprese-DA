const fs = require('fs');
const constants = require('./constants.js');

// Step2 keep a map of each function's object body. Each item has an ID, name, and a list of relationships. 
// relationships are basically the list of parents IDs. 
let functionsObjectList = {};

function computeBerkeResult(changes) {
    let impactSet = new Map()

    intrepretDAResult(changes, impactSet);

    intrepretFPData(impactSet);

    findFunctionsRelations(impactSet, changes)

    let impactSetOrderedList = sort(impactSet);

    impactSetOrderedList = replaceKeysWithObjects(impactSetOrderedList)

    fs.writeFileSync(constants.Berke_RESULT_PATH, JSON.stringify(impactSetOrderedList));
}

function sort(impactSet) {

    let sortableImpactSet = [];
    for (let item of impactSet) {
        sortableImpactSet.push({ ...{ "consequent": item[0] }, ...item[1] });
    }

    sortableImpactSet.sort(impactSetSorter());

    return sortableImpactSet
}

function impactSetSorter() {
    return function (a, b) {
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

        let aSupport = a['support'] || 0;
        let bSupport = b['support'] || 0;
        let aFP = a['FP-score'] || 0;
        let bFP = b['FP-score'] || 0;

        if (aSupport == bSupport) {
            if (bFP != aFP) {
                return bFP - aFP;
            }
        } else {
            return bSupport - aSupport;
        }

        let aDA = a['DA-antecedents'] || [];
        let bDA = b['DA-antecedents'] || [];
        return bDA.length - aDA.length;
    };
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
        if (!isIncluded(changes, item)) {
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
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(" ");
    for (let impacted in FPimapctSet) {
        let info = FPimapctSet[impacted];
        if (!removed.includes(impacted)) {
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

function getOrCreateFunctionObject(f) {
    if (functionsObjectList[f]) {
        return functionsObjectList[f]
    }

    let object = { "id": Object.keys(functionsObjectList).length, "parents": [] }
    functionsObjectList[f] = object
    return object
}

function findFunctionsRelations(impactSet, changes) {
    let impactSetKeys = Array.from(impactSet.keys())
    for (let i = 0; i < impactSetKeys.length; i += 1) {
        let itemi = impactSetKeys[i]
        for (let j = i+1; j < impactSetKeys.length; j += 1) {
            let itemj = impactSetKeys[j]
            setRelations(itemi, itemj)
        }

        for (let itemj of changes) {
            setRelations(itemi, itemj)
        }
    }

    for (let i = 0; i < changes.length; i++) {
        let itemi = changes[i]
        for (let j = i + 1; j < changes.length; j++) {
            setRelations(itemi, changes[j])
        }
    }    
}

function setRelations(item1, item2) {
    let item1_brokenName = item1.split('-')
    let item2_brokenName = item2.split('-')
    let item1_length = item1_brokenName.length
    let item2_length = item2_brokenName.length
    if (item1_brokenName[1] == item2_brokenName[1]) {
        let item1_beginning = parseInt(item1_brokenName[item1_length-2])
        let item1_end = parseInt(item1_brokenName[item1_length-1])

        let item2_beginning = parseInt(item2_brokenName[item2_length-2])
        let item2_end = parseInt(item2_brokenName[item2_length-1])

        if (item1_beginning <= item2_beginning && item1_end >= item2_end) {
            let item1_object = getOrCreateFunctionObject(item1)
            let item2_object = getOrCreateFunctionObject(item2)
            item2_object['parents'].push(item1_object['id'])
            functionsObjectList[item2] = item2_object

        } else if (item2_beginning <= item1_beginning && item2_end >= item1_end) {
            let item1_object = getOrCreateFunctionObject(item1)
            let item2_object = getOrCreateFunctionObject(item2)
            item1_object['parents'].push(item2_object['id'])
            functionsObjectList[item1] = item1_object
        }
    }
}

function replaceKeysWithObjects(impactSetList) {
    for (let item of impactSetList) {
        item['consequent'] = getObjectifiedKey(item['consequent'])

        let FPAntecedents = item['FP-antecedents']
        if (FPAntecedents != undefined) {
            let objectifiedAntecedents = []
            for (let antecedent of FPAntecedents) {
                objectifiedAntecedents.push(getObjectifiedList(antecedent))
            }
            item['FP-antecedents'] = objectifiedAntecedents
        }

        let DAAntecedents = item['DA-antecedents']
        if (DAAntecedents != undefined) {
            item['DA-antecedents'] = getObjectifiedList(DAAntecedents);
        }
    }
    return impactSetList
}

function getObjectifiedList(list) {
    let objectifiedList = [];
    for (let sub of list) {
        objectifiedList.push(getObjectifiedKey(sub));
    }
    return objectifiedList;
}

function getObjectifiedKey(sub) {
    let subObject = functionsObjectList[sub];
    let newSub = sub;
    if (subObject != undefined) {
        newSub += stringifyFunctionObject(subObject);
    }
    return newSub;
}

function stringifyFunctionObject(object) {

    return ` | {"id":${object['id']} - "parents":[${object['parents'].join("-")}]}`
}
module.exports = { computeBerkeResult , anonymouseName}