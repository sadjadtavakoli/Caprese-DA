// !!!!! DEPRECATED 
// DOESN'T FOLLOW THE LATEST EVALUATION SETUP

const fs = require("fs")
const { meanAveragePrecisionLatexRow, getFullTable } = require("./jsonToLatexRow")
const { benchmarkList, getActualImpactSetPath, getDetectedImpactSetPath } = require('../evaluationConstants')

let result = {}
let thresholds = [3, 5, 10, 20, 30, 60, "all"]
let latexRows = {}

benchmarkList.forEach(filename => {
    let actualImpactSets = JSON.parse(fs.readFileSync(getActualImpactSetPath(filename)));
    let benchResult = { "da": {}, "fp": {}, "caprese": {}, "tarmaq": {} }

    for (let threshold of thresholds) {
        benchResult["da"][threshold] = getMeanPrecision(filename, actualImpactSets, "da", threshold, getUnitsResult)
        benchResult["fp"][threshold] = getMeanPrecision(filename, actualImpactSets, "fp", threshold, getUnitsResult)
        benchResult["tarmaq"][threshold] = getMeanPrecision(filename, actualImpactSets, "tarmaq", threshold, getApproachResult)
        benchResult["caprese"][threshold] = getMeanPrecision(filename, actualImpactSets, "caprese", threshold, getApproachResult)
    }
    console.log(benchResult)
    result[filename] = benchResult
    latexRows[filename] = meanAveragePrecisionLatexRow(benchResult)
})

// console.log(getFullTable(latexRows))

function getMeanPrecision(filename, actualImpactSet, approach, threshold, getResult) {
    // Not tested
    let precisions = []
    let recalls = []

    let detectedImpactSet = JSON.parse(fs.readFileSync(getDetectedImpactSetPath(filename)));

    for (let commit in detectedImpactSet) {
        let impactset = getResult(detectedImpactSet[commit], approach)

        let _threshold = threshold == "all" ? impactset.length : Math.min(threshold, impactset.length)

        impactset = impactset.splice(0, _threshold)
        let totalRecalled = insertTruePositives(actualImpactSet[commit], impactset)
        let allPositives = actualImpactSet[commit]['impacted'].length
        
        console.log(_threshold)
        console.log(totalRecalled)
        console.log(actualImpactSet[commit]['impacted'])
        console.log(" - - - - ")
        let truePositiveCounter = 0;

        for (let index = 0; index < _threshold; index += 1) {
            let consequentInfo = impactset[index]
            if (consequentInfo['evaluation'].toUpperCase().includes('TP')) {
                truePositiveCounter += 1
            }
        }

        if (_threshold != 0) {
            let precision = truePositiveCounter / _threshold
            let recall = totalRecalled.length / allPositives
            precisions.push(precision);
            recalls.push(recall);
        }
    }

    result = {}
    if (precisions.length) {
        result['precision'] = average(precisions)
    } else {
        result['precision'] = "-"
    }

    if (recalls.length) {
        result['recall'] = average(recalls)
    } else {
        result['recall'] = "-"
    }

    return result

}

function insertTruePositives(actualImpactSet, detectedImpactSet) {
    // Not tested

    let groundTruth = actualImpactSet['impacted']
    let changeSet = actualImpactSet['changes']
    let actuallyRecalledEntities = []
    for (let entityInfo of detectedImpactSet) {
        let entity = entityInfo['consequent']
        let entitySecs = entity.split("-")

        // the actual impactSets
        if (entitySecs.length == 1 || (entitySecs[0] == entitySecs[1] && entitySecs[2] == 1)) {
            matchFile(entity, groundTruth, entityInfo, actuallyRecalledEntities)

        } else {
            matchNonFiles(entity, groundTruth, entityInfo, actuallyRecalledEntities)
        }

        // TODO I need to put some moth thoughts on this one!
        // true positive if the reported entities in nested or wrapped by a change set entity
        for (let change of changeSet) {
            if (areNested(entity, change)) {
                entityInfo['evaluation'] = "TP - NESTED/PARENT"
                if (!includes(actuallyRecalledEntities, entitySecs)) {
                    actuallyRecalledEntities.push(entitySecs)
                }
                if (!includes(groundTruth, entitySecs)) {
                    groundTruth.push(entitySecs)
                }
            }
        }
    }
    return actuallyRecalledEntities


    function matchNonFiles(entity, groundTruth, entityInfo, actuallyRecalledEntities) {
        let entitySecs = entity.split("-")
        let enFilePath = entitySecs[1]
        let enFirstLine = entitySecs[entitySecs.length - 2]
        let enLastLine = entitySecs[entitySecs.length - 1]

        let samefile = groundTruth.filter(item => item[1] == enFilePath)

        if (samefile.length == 0 && groundTruth.some(item => enFilePath.includes(item[1]) || (item[1].includes(enFilePath)))) {
            console.error("suspicious path!")
        }

        entityInfo['evaluation'] = "FP"

        for (let groundTruthEntity of samefile) {
            if (enFirstLine == groundTruthEntity[2] && enLastLine == groundTruthEntity[3]) {
                // True posive if exact match
                entityInfo['evaluation'] = "TP"
                
                if (!includes(actuallyRecalledEntities, groundTruthEntity)) {
                    actuallyRecalledEntities.push(groundTruthEntity)
                }

                break
            }
        }
        // !! not sure
        if (entityInfo['evaluation'] != "TP") {
            for (let groundTruthEntity of samefile) {
                if (areNested(groundTruthEntity.join("-"), entity)) {
                    // true positive if the reported entities in nested or wraps by an actually impacted entity
                    // entityInfo['evaluation'] = "TP - INDIRECT"
                    entityInfo['evaluation'] = "FP - INDIRECT"
                    // if (!includes(actuallyRecalledEntities, groundTruthEntity)) {
                    //     actuallyRecalledEntities.push(groundTruthEntity)
                    // }
                    break;
                }
            }
        }
    }

    function matchFile(entity, groundTruth, entityInfo, actuallyRecalledEntities) {
        let entitySecs = entity.split("-")
        let filePath = entitySecs[0]

        entityInfo['evaluation'] = "FP"

        let groundTruthFiles = groundTruth.filter(item => item[0] == item[1])

        if (groundTruthFiles.length == 0 && groundTruth.some(item => item[1] == filePath)) {
            // true positive if the reported entities wraps an actually impacted entity   
            entityInfo['evaluation'] = "FP - INDIRECT"
            // groundTruth.forEach(item => {
            //     if (item[1] == filePath) {
            //         if (!includes(actuallyRecalledEntities, item)) {
            //             actuallyRecalledEntities.push(item)
            //         }
            //     }
            // })
        }

        for (let groundTruthEntity of groundTruthFiles) {
            // match files
            if (filePath == groundTruthEntity[1]) {
                // True posive if exact match
                entityInfo['evaluation'] = "TP"
                if (!includes(actuallyRecalledEntities, groundTruthEntity)) {
                    actuallyRecalledEntities.push(groundTruthEntity)
                }
                break
            } else if (filePath.includes(groundTruthEntity[1]) || (groundTruthEntity[1].includes(filePath))) {
                entityInfo['evaluation'] = "FP - RMV"
            }
        }
    }
}

function getApproachResult(commitResult, approach) {
    if (approach == "caprese") {
        return commitResult[approach].sort(rankCapreseResult())
    } else {
        return commitResult[approach]
    }
}

function getUnitsResult(commitResult, approach) {
    let berke = commitResult["caprese"]
    if (approach == "fp") {
        return berke.filter(item => item["FP-antecedents"] != undefined).sort(rankFPResult())
    } else {
        return berke.filter(item => item["DA-antecedents"] != undefined)
    }
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

function rankCapreseResult() {
    return function (a, b) {
        if ((a['DA-antecedents'] && !b['DA-antecedents'])) {
            return -1;
        }
        if (b['DA-antecedents'] && !a['DA-antecedents']) {
            return 1;
        }
        // TODO this sorting doesn't seem right!
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

function average(array) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
}

function areNested(item1, item2) {
    let item1_info = getIndo(item1)
    let item2_info = getIndo(item2)

    if (item1_info['path'] == item2_info['path']) {
        let item2_is_nested = item1_info.first_line <= item2_info.first_line && (!item1_info.last_line || item1_info.last_line >= item2_info.last_line)
        let item1_is_nested = item2_info.first_line <= item1_info.first_line && (!item2_info.last_line || item2_info.last_line >= item1_info.last_line)
        return item2_is_nested || item1_is_nested
    }
    return false

    function getIndo(item) {
        let secs = item.split('-')
        return { name: secs[0], path: secs[1], first_line: parseInt(secs[secs.length - 2]), last_line: parseInt(secs[secs.length - 1]) }
    }
}

function includes(arr, newItem) {
    return arr.some(item => item[0] == newItem[0] && item[1] == newItem[1] && item[2] == newItem[2] && item[3] == newItem[3])
}