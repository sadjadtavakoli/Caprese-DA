const fs = require("fs")
const { meanAveragePrecisionLatexRow, getFullTable } = require("./utils/jsonToLatexRow")
const { benchmarkList, getActualImpactSetPath, getDetectedImpactSetPath, STATUS } = require('./evaluationConstants')

let result = {}
let thresholds = [5, 10, 20, 30, 60, "all"]
let latexRows = {}
benchmarkList.forEach(filename => {
    let benchResult = { "da": {}, "fp": {}, "caprese": {}, "tarmaq": {} }
    for (let threshold of thresholds) {
        benchResult["tarmaq"][threshold] = getMeanPrecision(filename, "tarmaq", threshold, getApproachResult)
        benchResult["caprese"][threshold] = getMeanPrecision(filename, "caprese", threshold, getApproachResult)
        benchResult["da"][threshold] = getMeanPrecision(filename, "da", threshold, getUnitsResult)
        benchResult["fp"][threshold] = getMeanPrecision(filename, "fp", threshold, getUnitsResult)
    }
    result[filename] = benchResult
    latexRows[filename] = meanAveragePrecisionLatexRow(benchResult)
})

console.log(getFullTable(latexRows))

function getMeanPrecision(filename, approach, threshold, getResult) {
    let precisions = []
    let recalls = []
    let truePositivesList = []
    let detectedImpactSets = JSON.parse(fs.readFileSync(getDetectedImpactSetPath(filename)));
    let actualImpactSet = JSON.parse(fs.readFileSync(getActualImpactSetPath(filename)));

    for (let commit in detectedImpactSets) {
        let detectedImpactSet = getResult(detectedImpactSets[commit], approach)

        let _threshold = threshold == "all" ? detectedImpactSet.length : Math.min(threshold, detectedImpactSet.length)
        let allPositives = actualImpactSet[commit]['impacted'].length
        if (_threshold != 0 && allPositives != 0) {
            let topDetectedImpactSet = detectedImpactSet.splice(0, _threshold)
            let truePositives = topDetectedImpactSet.filter(item => item['status'] != STATUS.removed && item['evaluation'].toUpperCase().includes("TP"))
            let precision = truePositives.length / _threshold
            let recall = truePositives.length / allPositives
            precisions.push(precision);
            recalls.push(recall);
            truePositivesList.push(truePositives.length);
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
    return commitResult[approach]
}

function getUnitsResult(commitResult, approach) {
    let berke = commitResult["caprese"]
    if (approach == "fp") {
        let filtered = berke.filter(item => item["FP-antecedents"] != undefined)
        return filtered.sort(rankFPResult())
    } else {
        let filtered = berke.filter(item => item["DA-distance"] != undefined)
        return filtered.sort(rankDAResult())
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

function rankDAResult() {
    return function (a, b) {
        return a['DA-distance'] = b['DA-distance']
    };
}

function average(array) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
}