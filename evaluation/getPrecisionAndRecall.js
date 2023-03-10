const fs = require("fs")
const { getFullTable, meanAveragePrecisionAndRecallLatexRow } = require("./utils")
const { benchmarkList, getActualImpactSetPath, getDetectedImpactSetPath, STATUS } = require('./evaluationConstants')
const { rankFPResult, rankDAResult } = require("../computeBerkeResult")

let result = {}
let thresholds = [5, 10, 20, 30, 60, "all"]
let latexRows = {}
benchmarkList.forEach(filename => {
    let benchResult = { "fp": {}, "caprese": {}, "tarmaq": {}, "tarmaq-filtered": {} }
    for (let threshold of thresholds) {
        benchResult["tarmaq-filtered"][threshold] = getMeanPrecision(filename, "tarmaq-filtered", threshold, getApproachResult)
        benchResult["tarmaq"][threshold] = getMeanPrecision(filename, "tarmaq", threshold, getApproachResult)
        benchResult["caprese"][threshold] = getMeanPrecision(filename, "caprese", threshold, getApproachResult)
        benchResult["fp"][threshold] = getMeanPrecision(filename, "fp", threshold, getUnitsResult)
    }
    result[filename] = benchResult
    latexRows[filename] = meanAveragePrecisionAndRecallLatexRow(benchResult)
})

console.log(getFullTable(latexRows))

function getMeanPrecision(filename, approach, threshold, getResult) {
    let precisions = []
    let recalls = []
    let truePositivesList = []
    let detectedImpactSets = JSON.parse(fs.readFileSync(getDetectedImpactSetPath(filename)));
    let actualImpactSet = JSON.parse(fs.readFileSync(getActualImpactSetPath(filename)));

    for (let commit in detectedImpactSets) {
        let allPositives = actualImpactSet[commit]['impacted'].length
        let detectedImpactSet = getResult(detectedImpactSets[commit], approach)

        if (detectedImpactSet != undefined && allPositives != 0) {
            let _threshold = threshold == "all" ? detectedImpactSet.length : Math.min(threshold, detectedImpactSet.length)
            if (_threshold != 0) {
                let topDetectedImpactSet = detectedImpactSet.splice(0, _threshold)
                let truePositives = topDetectedImpactSet.filter(item => item['status'] != STATUS.removed && item['evaluation'].toUpperCase().includes("TP"))
                let precision = truePositives.length / _threshold
                let recall = truePositives.length / allPositives
                precisions.push(precision);
                recalls.push(recall);
                truePositivesList.push(truePositives.length);
            }
        }
    }

    let result = {}
    if (precisions.length) {
        result['P'] = average(precisions)
    } else {
        result['P'] = "-"
    }

    if (recalls.length) {
        result['R'] = average(recalls)
    } else {
        result['R'] = "-"
    }

    if (truePositivesList.length) {
        result['TP'] = average(truePositivesList)
    } else {
        result['TP'] = "-"
    }
    return JSON.stringify(result)

}

function getApproachResult(commitResult, approach) {
    if (approach == "tarmaq-filtered") {
        return commitResult["tarmaq"].filter(item => item['confidence'] >= 0.4)
    }
    return commitResult[approach]
}

function getUnitsResult(commitResult, approach) {
    let caprese = commitResult["caprese"]
    if (approach == "fp") {
        let filtered = caprese.filter(item => item["FP-antecedents"] != undefined)
        return filtered.sort(rankFPResult())
    } else {
        let filtered = caprese.filter(item => item["DA-distance"] != undefined)
        return filtered.sort(rankDAResult())
    }
}

function average(array) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
}