const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { meanAveragePrecisionLatexRow, getFullTable } = require("./jsonToLatexRow")

let projects_list = ["eslint-plugin-react", "ws", "cla-assistant", "grant", "markdown-it", "environment", "nodejs-cloudant", "assemble", "express", "session", "jhipster-uml", "neo-async"]
let result = {}
let thresholds = [5, 10, 20, 30, 60, 10000]
let latexRows = {}
projects_list.forEach(filename => {
    const RESULT_PATH = `${resultDirPath}${filename}${path.sep}results.json`
    let evaluationResult = JSON.parse(fs.readFileSync(RESULT_PATH));
    let benchResult = { "FP": {}, "tarmaq": {}, "berke": {} }

    for (let threshold of thresholds) {
        benchResult["FP"][threshold] = getFPAveragePrecision(evaluationResult, threshold)
        benchResult["tarmaq"][threshold] = approachSummary(evaluationResult, "tarmaq", threshold)
        benchResult["berke"][threshold] = approachSummary(evaluationResult, "berke", threshold)
    }
    result[filename] = benchResult
    latexRows[filename] = meanAveragePrecisionLatexRow(benchResult)
})

console.log(getFullTable(latexRows))

function getFPAveragePrecision(result, threshold) {
    let sumOfAveragePrecisions = 0;

    for (let commit in result) {
        let berke = result[commit]['berke']
        let berkeFP = berke.filter(item => item['FP-evaluation'] != undefined)

        berkeFP.sort(rankFPresult())

        let truePositiveCounter = 0;
        let sumOfPrecisions = 0;

        let endIndex = Math.min(threshold, berkeFP.length)

        for (let index = 0; index < endIndex; index += 1) {
            let consequentInfo = berkeFP[index]
            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['FP-evaluation'])

            let precisionSoFar = truePositiveCounter / (index + 1)
            sumOfPrecisions += precisionSoFar
        }

        let impactSetSize = berkeFP.length;
        let averagePrecision = impactSetSize ? sumOfPrecisions / endIndex : 0;
        sumOfAveragePrecisions += averagePrecision;
    }

    let length = Object.keys(result).length

    return (sumOfAveragePrecisions / length).toFixed(2)
}

function approachSummary(result, approach, threshold) {
    let sumOfAveragePrecisions = 0;

    for (let commit in result) {
        let impactset = result[commit][approach]

        let endIndex = Math.min(threshold, impactset.length)

        if (approach == "berke") {
            impactset.sort(rankCapreseResult())
        }

        let truePositiveCounter = 0;
        let sumOfPrecisions = 0;

        for (let index = 0; index < endIndex; index += 1) {
            let consequentInfo = impactset[index]

            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['DA-evaluation'] + " " + consequentInfo['FP-evaluation'])

            let precisionSoFar = truePositiveCounter / (index + 1)
            sumOfPrecisions += precisionSoFar
        }


        let impactSetSize = impactset.length;
        let averagePrecision = impactSetSize ? sumOfPrecisions / endIndex : 0;
        sumOfAveragePrecisions += averagePrecision;
    }

    let length = Object.keys(result).length

    return (sumOfAveragePrecisions / length).toFixed(2)

}
function increaseIfIsTruePositive(totalTruePositives, evaluationResult) {
    if (evaluationResult.toLowerCase().includes('true')) {
        totalTruePositives += 1
    }
    return totalTruePositives
}

function rankFPresult() {
    return function (a, b) {
        if (b['support'] == a['support']) {
            return b['FP-score'] - a['FP-score'];
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
        if (a['FP-antecedents'] && !b['FP-antecedents']) {
            return -1;
        }
        if (b['FP-antecedents'] && !a['FP-antecedents']) {
            return 1;
        }

        let aSupport = a['support'] || 0;
        let bSupport = b['support'] || 0;
        let aFP = a['FP-score'] || 0;
        let bFP = b['FP-score'] || 0;

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