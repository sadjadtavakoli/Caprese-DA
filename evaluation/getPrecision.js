const fs = require("fs")
const { getFullTable, meanAveragePrecisionLatexRow } = require("./utils")
const { benchmarkList, getActualImpactSetPath, getDetectedImpactSetResultsPath, STATUS } = require('./evaluationConstants')

let result = {}
let thresholds = [5, 10, 20, 30, 60]
let latexRows = {}
benchmarkList.forEach(filename => {
    let benchResult = {
        "DA": {},
        "FPD": {},
        "caprese": {}
    }
    
    for (let threshold of thresholds) {

        benchResult["caprese"][threshold] = getMeanPrecision(filename, "caprese", threshold, getApproachResult)
        benchResult["DA"][threshold] = getMeanPrecision(filename, "DA", threshold, getUnitsResult)
        benchResult["FPD"][threshold] = getMeanPrecision(filename, "FPD", threshold, getUnitsResult)
    
    }
    result[filename] = benchResult
    latexRows[filename] = meanAveragePrecisionLatexRow(benchResult)
})
console.log("\n ==== results as json === \n")
console.log(result)
console.log("\n ==== latex table === \n")
console.log(getFullTable(latexRows))

function getMeanPrecision(filename, approach, threshold, getResult) {
    let precisions = []
    let detectedImpactSets = JSON.parse(fs.readFileSync(getDetectedImpactSetResultsPath(filename)));
    let actualImpactSet = JSON.parse(fs.readFileSync(getActualImpactSetPath(filename)));

    for (let commit in detectedImpactSets) {

        let allPositives = actualImpactSet[commit]['impacted'].length

        let detectedImpactSet = getResult(detectedImpactSets[commit], approach)


        if (detectedImpactSet != undefined && allPositives != 0) {
            let _threshold = Math.min(threshold, detectedImpactSet.length)
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
    if (approach == "FPD") {
        let filtered = caprese.filter(item => item["FPD-antecedents"] != undefined)
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