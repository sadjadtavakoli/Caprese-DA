const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { meanAveragePrecisionLatexRow, getFullTable } = require("./jsonToLatexRow")
const { average } = require("./showResult")

let projects_list = ["eslint-plugin-react", "ws", "cla-assistant", "grant", "markdown-it", "environment", "nodejs-cloudant", "assemble", "express", "session", "jhipster-uml", "neo-async"]
let result = {}
let thresholds = [5, 10, 20, 30, 60, "all"]
let latexRows = {}
projects_list.forEach(filename => {
    const RESULT_PATH = `${resultDirPath}${filename}${path.sep}results.json`
    // console.log(RESULT_PATH)
    let evaluationResult = JSON.parse(fs.readFileSync(RESULT_PATH));
    let benchResult = { "FP": {}, "tarmaq": {}, "berke": {} }
    console.log(filename)
    for (let threshold of thresholds) {
        // console.log("* * * * *")
        // console.log(threshold)
        benchResult["FP"][threshold] = getFPAveragePrecision(evaluationResult, threshold)
        benchResult["tarmaq"][threshold] = approachSummary(evaluationResult, "tarmaq", threshold)
        benchResult["berke"][threshold] = approachSummary(evaluationResult, "berke", threshold)
    }
    result[filename] = benchResult
    latexRows[filename] = meanAveragePrecisionLatexRow(benchResult)
})

console.log(getFullTable(latexRows))

function getFPAveragePrecision(result, threshold) {
    let precisions = []

    for (let commit in result) {
        let berke = result[commit]['berke']
        let berkeFP = berke.filter(item => item['FP-evaluation'] != undefined)
        let _threshold = threshold == "all" ? berkeFP.length : Math.min(threshold, berkeFP.length)

        berkeFP.sort(rankFPresult())

        let truePositiveCounter = 0;
        for (let index = 0; index < _threshold; index += 1) {
            let consequentInfo = berkeFP[index]
            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['FP-evaluation'])
        }
        if(_threshold != 0){
            let precision = truePositiveCounter / _threshold
            precisions.push(precision);
        } 
    }
    if(precisions.length){
        return average(precisions)
    }
    return "-"
}

function approachSummary(result, approach, threshold) {
    let precisions = []

    for (let commit in result) {
        let impactset = result[commit][approach]
        let _threshold = threshold == "all" ? impactset.length : Math.min(threshold, impactset.length)

        if (approach == "berke") {
            impactset.sort(rankCapreseResult())
        }

        let truePositiveCounter = 0;
        for (let index = 0; index < _threshold; index += 1) {
            let consequentInfo = impactset[index]
            console.log(consequentInfo)
            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['DA-evaluation'] + " " + consequentInfo['FP-evaluation'])
        }
        if(_threshold != 0){
            let precision = truePositiveCounter / _threshold
            precisions.push(precision);
        } 
    }
    if(precisions.length){
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