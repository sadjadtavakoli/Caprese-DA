const fs = require('fs');
const constants = require('./constants.js');


function computeBerkeResult(changes) {
    let impactSet = new Map()

    intrepretFPData(impactSet);

    intrepretDAResult(changes, impactSet);

    let impactSetOrderedList = sort(impactSet);

    // console.log(impactSetOrderedList)

    fs.writeFileSync(constants.Berke_RESULT_PATH, JSON.stringify(impactSetOrderedList));
}

function computeBerkeResultNoDA(changes) {
    let impactSet = new Map()

    intrepretFPDataNoDA(impactSet);

    let impactSetOrderedList = sort(impactSet);

    fs.writeFileSync(constants.Berke_RESULT_PATH + "NoDA.json", JSON.stringify(impactSetOrderedList));
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
        if ((a['DA-distance'] && !b['DA-distance'])) {
            return -1;
        }
        if (b['DA-distance'] && !a['DA-distance']) {
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
        let aFP = a['confidence'] || 0;
        let bFP = b['confidence'] || 0;

        if (aSupport == bSupport) {
            if (bFP != aFP) {
                return bFP - aFP;
            }
        } else {
            return bSupport - aSupport;
        }

        let aDA = a['DA-distance'] || 0;
        let bDA = b['DA-distance'] || 0;
        return aDA - bDA;
    };
}

function intrepretDAResult(changeSet, impactSet) {
    let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH));
    let keyMap = dependenciesData['keyMap'];

    let dynamicImpactSet = getImpactSet(changeSet, new Map(), 1)

    for (let [entryID, distance] of dynamicImpactSet.entries()) {
        item = keyMap[entryID]

        if (!isChangeSetEntity(item)) {
            if (impactSet.has(item)) {
                let imapctedItem = impactSet.get(item)
                imapctedItem['DA-distance'] = distance
            } else if (impactSet.has(anonymouseName(item))) {
                let imapctedItem = impactSet.get(anonymouseName(item))
                imapctedItem['DA-distance'] = distance
                impactSet.set(item, imapctedItem);
                impactSet.delete(anonymouseName(item))
            } else {
                impactSet.set(item, { 'DA-distance': distance });
            }
        }
    }

    function getImpactSet(changeSet, impactSet, distance) {
        nextLayer = []
        for (let change of changeSet) {

            let dependencies = dependenciesData[change];
            if (dependencies == undefined) {
                dependencies = dependenciesData[anonymouseName(change)];
            }

            if (dependencies != undefined) {
                for (let dependency of dependencies['impacted']) {
                    if (!impactSet.has(dependency)) {
                        impactSet.set(dependency, distance)
                        nextLayer.push(keyMap[dependency])
                    }
                }
            }
        }
        if (nextLayer.length) {
            impactSet = getImpactSet(nextLayer, impactSet, distance + 1)
        }

        return impactSet
    }

    function isChangeSetEntity(item) {
        return changeSet.some(changedItem =>
            changedItem == item || anonymouseName(changedItem) == item)
    }
}

function intrepretFPData(impactSet) {
    let FPimapctSet = JSON.parse(fs.readFileSync(constants.FP_RESULT_PATH));
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(" ");

    for (let impacted in FPimapctSet) {
        let info = FPimapctSet[impacted];

        if (!removed.includes(impacted)) {

            if (impactSet.has(impacted)) {
                console.error("NOPE!")
                impactSet.set(impacted, { ...impactSet.get(impacted), ...info });
            } else if (impactSet.has(anonymouseName(impacted))) {
                console.error("NOPE! Anonymous")
                impactSet.set(impacted, { ...impactSet.get(anonymouseName(impacted)), ...info });
                impactSet.delete(anonymouseName(impacted))
            } else {
                impactSet.set(impacted, info);
            }
        }
    }
}

function intrepretFPDataNoDA(impactSet) {
    let FPimapctSet = JSON.parse(fs.readFileSync(constants.FP_RESULT_PATH));
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(" ");
    for (let impacted in FPimapctSet) {
        let info = FPimapctSet[impacted];
        if (!removed.includes(impacted)) {
            impactSet.set(impacted, info);
        }
    }
}

function anonymouseName(name) {
    return name.replace(/((?![.])([^-])*)/, "arrowAnonymousFunction");
}

module.exports = { computeBerkeResult, anonymouseName, computeBerkeResultNoDA }