// !!!!! DEPRECATED 
// DOESN'T FOLLOW THE LATEST EVALUATION SETUP

const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { meanAveragePrecisionLatexRow, getFullTable } = require("./jsonToLatexRow")
const { average } = require("./showResult")
const { benchmarkList } = require('../evaluationConstants')

let result = {}
let thresholds = [3, 5, 10, 20, 30, 60, "all"]
let latexRows = {}
benchmarkList.forEach(filename => {
    const RESULT_PATH = `${resultDirPath}${filename}${path.sep}results.json`
    // console.log(RESULT_PATH)
    let evaluationResult = JSON.parse(fs.readFileSync(RESULT_PATH));
    let benchResult = { "da": {}, "fp": {}, "caprese": {}, "tarmaq": {} }
    // console.log(filename)
    for (let threshold of thresholds) {
        // console.log("* * * * *")
        // console.log(threshold)
        benchResult["da"][threshold] = getUnitMeanPrecision(evaluationResult, "da", threshold)
        benchResult["fp"][threshold] = getUnitMeanPrecision(evaluationResult, "fp", threshold)
        benchResult["tarmaq"][threshold] = approachMeanPrecision(evaluationResult, "tarmaq", threshold)
        benchResult["caprese"][threshold] = approachMeanPrecision(evaluationResult, "caprese", threshold)
    }
    result[filename] = benchResult
    latexRows[filename] = meanAveragePrecisionLatexRow(benchResult)
})

console.log(getFullTable(latexRows))

function getUnitMeanPrecision(result, unit, threshold) {
    let precisions = []

    let unitKeys = {
        'da': 'DA-evaluation',
        'fp': "FP-evaluation"
    }

    let unitKey = unitKeys[unit]

    for (let commit in result) {
        let berke = result[commit]["caprese"]
        let unitResults = berke.filter(item => item[unitKey] != undefined)
        let _threshold = threshold == "all" ? unitResults.length : Math.min(threshold, unitResults.length)

        unitResults.sort(rankResult(unit))

        let truePositiveCounter = 0;
        for (let index = 0; index < _threshold; index += 1) {
            let consequentInfo = unitResults[index]
            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo[unitKey])
        }
        if (_threshold != 0) {
            let precision = truePositiveCounter / _threshold
            precisions.push(precision);
        }
    }
    if (precisions.length) {
        return average(precisions)
    }
    return "-"
}

function approachMeanPrecision(result, approach, threshold) {
    let precisions = []

    for (let commit in result) {
        let impactset = result[commit][approach]
        let _threshold = threshold == "all" ? impactset.length : Math.min(threshold, impactset.length)

        if (approach == "caprese") {
            impactset.sort(rankCapreseResult())
        }

        let truePositiveCounter = 0;
        for (let index = 0; index < _threshold; index += 1) {
            let consequentInfo = impactset[index]
            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['DA-evaluation'] + " " + consequentInfo['FP-evaluation'])
        }
        if (_threshold != 0) {
            let precision = truePositiveCounter / _threshold
            precisions.push(precision);
        }
    }
    if (precisions.length) {
        return average(precisions)
    }
    return "-"
}

function increaseIfIsTruePositive(totalTruePositives, evaluationResult) {
    if (evaluationResult.toLowerCase().includes('true')) {
        totalTruePositives += 1
    }
    return totalTruePositives
}

function rankResult(unit) {
    if (unit == 'da') {
        return function (a, b) {
            let aDA = a['DA-antecedents'] || [];
            let bDA = b['DA-antecedents'] || [];
            return bDA.length - aDA.length;
        };
    } else {
        return function (a, b) {
            if (b['support'] == a['support']) {
                return b['confidence'] - a['confidence'];
            } else {
                return b['support'] - a['support'];
            }
        };
    }
}

function rankCapreseResult() {
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