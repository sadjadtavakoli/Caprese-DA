const fs = require('fs');
const constants = require('./constants.js');


function computeCapreseResult(changes, outputFile) {
    console.log(" = = = Compute Imapct Set = = = ")

    let impactSet = new Map()

    intrepretFPData(impactSet);

    intrepretDAResult(changes, impactSet);

    let impactSetOrderedList = getRankedResult(impactSet);

    outputFile = outputFile != undefined ? outputFile : constants.Caprese_RESULT_PATH
    fs.writeFileSync(outputFile, JSON.stringify(impactSetOrderedList));
    console.log("impact set is stored in", outputFile)

}

function computeCapreseResultNoDA() {
    let impactSet = new Map()

    intrepretFPDataNoDA(impactSet);

    let impactSetOrderedList = getRankedResultNoDA(impactSet);

    fs.writeFileSync(constants.Caprese_RESULT_PATH + "NoDA.json", JSON.stringify(impactSetOrderedList));
}

function getRankedResult(impactSet) {

    let commonImpactSet = [];
    let uniquelyByDA = [];
    let uniquelyByFP = [];
    for (let item of impactSet) {
        info = item[1]
        let data = { ...{ "consequent": item[0] }, ...item[1] }
        if (info['DA-distance'] != undefined && info['FPD-antecedents'] != undefined) {
            commonImpactSet.push(data)
        } else if (info['DA-distance'] != undefined) {
            uniquelyByDA.push(data)
        } else if (info['FPD-antecedents'] != undefined) {
            uniquelyByFP.push(data)
        }
    }
    commonImpactSet.sort(commonImpactSetSorter())
    uniquelyByDA.sort(rankDAResult())
    uniquelyByFP.sort(rankFPResult())

    let mergedDAandFP = mergeLists(uniquelyByDA, uniquelyByFP)
    return commonImpactSet.concat(mergedDAandFP)

    function mergeLists(da, fp) {

        let newList = []
        let max = Math.max(da.length, fp.length)
        let min = Math.min(da.length, fp.length)

        for (let i = 0; i < min; i += 1) {
            newList.push(da[i])
            newList.push(fp[i])
        }

        if (da.length > min) {
            newList = newList.concat(da.splice(min, max - min))
        }

        if (fp.length > min) {
            newList = newList.concat(fp.splice(min, max - min))
        }
        return newList
    }
}

function commonImpactSetSorter() {
    return function (a, b) {
        if (a['DA-distance'] != b['DA-distance']) {
            return a['DA-distance'] - b['DA-distance'];
        }

        let aSupport = a['support'];
        let bSupport = b['support'];
        if (aSupport != bSupport) {
            return bSupport - aSupport;
        }

        let aFP = a['confidence'];
        let bFP = b['confidence'];
        return bFP - aFP;
    };
}

function rankFPResult() {
    return function (a, b) {
        if (b['support'] == a['support']) {
            return b['confidence'] - a['confidence'];
        } else {
            return b['support'] - a['support'];
        }
    };
}

function rankDAResult() {
    return function (a, b) {
        return a['DA-distance'] - b['DA-distance']
    };
}

function getRankedResultNoDA(impactSet) {
    let uniquelyByFP = [];
    for (let item of impactSet) {
        info = item[1]
        let data = { ...{ "consequent": item[0] }, ...item[1] }
        uniquelyByFP.push(data)
    }

    uniquelyByFP.sort(rankFPResult())
    return uniquelyByFP
}

function intrepretDAResult(changeSet, impactSet) {
    let dependenciesData = JSON.parse(fs.readFileSync(constants.DA_DEPENDENCIES_PATH));

    let dynamicImpactSet = getDAImpactSet(changeSet, new Map(), 1)

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

    function getDAImpactSet(changeSet, dynamicImpactSet, distance) {
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
            dynamicImpactSet = getDAImpactSet(nextLayer, dynamicImpactSet, distance + 1)
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
                // console.error("NOPE!")
                impactSet.set(impacted, { ...impactSet.get(impacted), ...info });
            } else if (impactSet.has(anonymouseName(impacted))) {
                // console.error("NOPE! Anonymous")
                // console.log(impacted)
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

module.exports = { computeCapreseResult, anonymouseName, computeCapreseResultNoDA, rankDAResult, rankFPResult }