const fs = require('fs');
const constants = require('./constants.js');


function computeBerkeResult(changes) {
    let impactSet = new Map()

    intrepretFPData(impactSet);

    intrepretDAResult(changes, impactSet);

    let impactSetOrderedList = getRankedResult(impactSet);

    fs.writeFileSync(constants.Berke_RESULT_PATH, JSON.stringify(impactSetOrderedList));
}

function computeBerkeResultNoDA(changes) {
    let impactSet = new Map()

    intrepretFPDataNoDA(impactSet);

    let impactSetOrderedList = getRankedResult(impactSet);

    fs.writeFileSync(constants.Berke_RESULT_PATH + "NoDA.json", JSON.stringify(impactSetOrderedList));
}

function getRankedResult(impactSet) {

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

    let dynamicImpactSet = getImpactSet(changeSet, new Map(), 1)

    for (let [item, distance] of dynamicImpactSet.entries()) {

        if (!isChangeSetEntity(item)) {
            if (impactSet.has(item)) {
                let imapctedItem = impactSet.get(item)
                if (imapctedItem['DA-distance'] == undefined) imapctedItem['DA-distance'] = distance
            } else if (impactSet.has(anonymouseName(item))) {
                let imapctedItem = impactSet.get(anonymouseName(item))
                if (imapctedItem['DA-distance'] == undefined) imapctedItem['DA-distance'] = distance
                impactSet.set(item, imapctedItem);
                impactSet.delete(anonymouseName(item))
            } else {
                impactSet.set(item, { 'DA-distance': distance });
            }
        }
    }

    function getImpactSet(changeSet, dynamicImpactSet, distance) {
        let nextLayer = []
        for (let change of changeSet) {
            let dependencies = dependenciesData[change];
            if (dependencies == undefined) {
                dependencies = dependenciesData[anonymouseName(change)];
            }

            if (dependencies != undefined) {
                for (let dependency of dependencies['impacted']) {
                    if (!dynamicImpactSet.has(dependency)) {
                        dynamicImpactSet.set(dependency, distance)
                        nextLayer.push(dependency)
                    }
                }
            }
        }
        if (nextLayer.length) {
            dynamicImpactSet = getImpactSet(nextLayer, dynamicImpactSet, distance + 1)
        }

        return dynamicImpactSet
    }

    function isChangeSetEntity(item) {
        return changeSet.some(changedItem => {
            return changedItem == item || anonymouseName(changedItem) == item
        })
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

// function getRankedResult(impactSet) {


//     let commonImpactSet = [];
//     let uniquelyByDA = [];
//     let uniquelyByFP = [];
//     for (let item of impactSet) {
//         let info = item[1]
//         let data = { ...{ "consequent": item[0] }, ...item[1] }
//         if (info['DA-distance'] != undefined && info['FP-antecedents'] != undefined) {
//             commonImpactSet.push(data)
//         } else if (info['DA-distance'] != undefined) {
//             uniquelyByDA.push(data)
//         } else {
//             uniquelyByFP.push(data)
//         }
//     }
//     commonImpactSet.sort(commonImpactSetSorter())
//     uniquelyByDA.sort(DASorter())
//     uniquelyByFP.sort(FPSetSorter())

//     let mergedDAandFP = mergeLists(uniquelyByDA, uniquelyByFP)
//     return commonImpactSet.concat(mergedDAandFP)


//     function mergeLists(list1, list2) {
//         let max = Math.max(list1.length, list2.length)
//         let min = Math.min(list1.length, list2.length)

//         let newList = []

//         for (let i = 0; i < min; i += 1) {
//             newList.push(list1[i])
//             newList.push(list2[i])
//         }

//         if (list1.length > min) {
//             newList = newList.concat(list1.splice(min, max - min))
//         }

//         if (list2.length > min) {
//             newList = newList.concat(list2.splice(min, max - min))
//         }
//         return newList
//     }
// }

// function commonImpactSetSorter() {
//     return function (a, b) {

//         let aSupport = a['support'];
//         let bSupport = b['support'];
//         if (aSupport != bSupport) {
//             return bSupport - aSupport;
//         }

//         let aFP = a['confidence'];
//         let bFP = b['confidence'];
//         if (bFP != aFP) {
//             return bFP - aFP;
//         }

//         return a['DA-distance'] - b['DA-distance'];
//     };
// }

// function FPSetSorter() {
//     return function (a, b) {

//         let aSupport = a['support'];
//         let bSupport = b['support'];
//         if (aSupport != bSupport) {
//             return bSupport - aSupport;
//         }

//         return b['confidence'] - a['confidence'];
//     };
// }

// function DASorter() {
//     return function (a, b) {
//         return a['DA-distance'] - b['DA-distance'];
//     };
// }