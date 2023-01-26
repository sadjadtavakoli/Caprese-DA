const fs = require('fs');
const constants = require('./constants.js');


function computeBerkeResult(changes) {
    let impactSet = new Map()

    intrepretDAResult(changes, impactSet);

    intrepretFPData(impactSet);

    let impactSetOrderedList = sort(impactSet);

    fs.writeFileSync(constants.Berke_RESULT_PATH, JSON.stringify(impactSetOrderedList));
}

function computeBerkeResultNoDA(changes) {
    let impactSet = new Map()

    intrepretFPDataNoDA(impactSet);

    let impactSetOrderedList = sort(impactSet);

    fs.writeFileSync(constants.Berke_RESULT_PATH+"NoDA.json", JSON.stringify(impactSetOrderedList));
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
        let aFP = a['confidence'] || 0;
        let bFP = b['confidence'] || 0;

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

function isIncluded(changes, item) {
    return changes.some(changedItem =>
        changedItem == item || anonymouseName(changedItem) == item)
}
function anonymouseName(name) {
    return name.replace(/((?![.])([^-])*)/, "arrowAnonymousFunction");
}

module.exports = { computeBerkeResult , anonymouseName, computeBerkeResultNoDA}