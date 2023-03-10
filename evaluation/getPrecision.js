const fs = require("fs")
const { getFullTable, meanAveragePrecisionLatexRow } = require("./utils")
const { benchmarkList, getActualImpactSetPath, getDetectedImpactSetPath, STATUS } = require('./evaluationConstants')

let result = {}
let thresholds = [5, 10, 20, 30, 60, "all"]
let latexRows = {}
benchmarkList.forEach(filename => {
    let benchResult = {
        "da": {},
        "fp": {},
        "caprese": {}
    }
    for (let threshold of thresholds) {
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
    let detectedImpactSets = JSON.parse(fs.readFileSync(getDetectedImpactSetPath(filename)));
    let actualImpactSet = JSON.parse(fs.readFileSync(getActualImpactSetPath(filename)));

    for (let commit in detectedImpactSets) {

        let allPositives = actualImpactSet[commit]['impacted'].length

        let detectedImpactSet = getResult(detectedImpactSets[commit], approach)


        if (detectedImpactSet != undefined && allPositives != 0) {
            let _threshold = 0
            if (threshold == "all") {
                _threshold = detectedImpactSet.length
            } else {
                _threshold = Math.min(threshold, detectedImpactSet.length)
            }

            if (_threshold != 0) {
                let topDetectedImpactSet = detectedImpactSet.splice(0, _threshold)
                let truePositives = topDetectedImpactSet.filter(item => item['status'] != STATUS.removed && item['evaluation'].toUpperCase().includes("TP"))
                let precision = truePositives.length / _threshold
                precisions.push(precision);
            }
        }
    }

    if (precisions.length) {
        return average(precisions)
    } else {
        return "-"
    }
}

function getApproachResult(commitResult, approach) {
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

function average(array) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
}