const fs = require('fs');
const constants = require('./constants.js');


function computeBerkeResult(changes) {
    // console.log(" = = = Compute Impact-set = = = ");
    let impactSet = new Map()

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
            let unknownKey = changedFucntion.replace(/((?![.])([^-])*)/, "arrowAnonymousFunction");
            dependencies = dependenciesData[unknownKey];
        }

        if (dependencies != undefined) {
            for (let dependency of dependencies['impacted']) {
                addDAImpactSet(keyMap[dependency], changedFucntion);
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

function intrepretFPData(impactSet) {
    let FPimapctSet = JSON.parse(fs.readFileSync(constants.PATTERNS_PATH));
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");
    for (let impacted in FPimapctSet) {
        let info = FPimapctSet[impacted];
        if(!removed.includes(impacted)){
            if (impactSet.has(impacted)) {
                impactSet.set(impacted, {...impactSet.get(impacted), ...info});
            } else {
                impactSet.set(impacted, info); 
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

module.exports = { computeBerkeResult }