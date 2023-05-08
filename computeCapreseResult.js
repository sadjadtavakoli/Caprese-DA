const fs = require('fs');
const constants = require('./constants.js');


function computeCapreseResult(changes, outputFile) {
    console.log(" = = = Compute Imapct Set = = = ")

    let impactSet = new Map()

    intrepretDAResult(changes, impactSet);

    let impactSetOrderedList = getRankedResult(impactSet);

    outputFile = outputFile != undefined ? outputFile : constants.Caprese_RESULT_PATH
    fs.writeFileSync(outputFile, JSON.stringify(impactSetOrderedList));
    console.log("impact set is stored in", outputFile)

}

function getRankedResult(impactSet) {

    let uniquelyByDA = [];
    for (let item of impactSet) {
        uniquelyByDA.push({ ...{ "consequent": item[0] }, ...item[1] })
    }
    uniquelyByDA.sort(rankDAResult())

    return uniquelyByDA

}

function rankDAResult() {
    return function (a, b) {
        return a['DA-distance'] - b['DA-distance']
    };
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

function anonymouseName(name) {
    return name.replace(/((?![.])([^-])*)/, "arrowAnonymousFunction");
}

module.exports = { computeCapreseResult }