const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require('./evaluation')
const { benchmarkList } = require('./projects_confiqs')

if (process.argv[1].endsWith(path.basename(__filename))) {
    benchmarkList.forEach(filename => {
        addEvaluationResult(filename)
    })
}
function addEvaluationResult(filename) {
    const RESULT_PATH = `${resultDirPath}${filename}${path.sep}results.json`
    let result = JSON.parse(fs.readFileSync(RESULT_PATH));

    for (let commit in result) {
        let reversedFPTARMAQ = result[commit]['reversed-FP-TARMAQ']
        let reversedDA = result[commit]['reversed-DA']
        let berke = result[commit]['berke']
        let tarmaq = result[commit]['tarmaq']

        let FPTARMAQEvaluation = collectEvaluationResult(reversedFPTARMAQ)
        let DAEvaluation = collectEvaluationResult(reversedDA)

        insertEvaluationResult(berke, FPTARMAQEvaluation, DAEvaluation)
        insertEvaluationResult(tarmaq, FPTARMAQEvaluation, DAEvaluation)

    }
    fs.writeFileSync(RESULT_PATH, JSON.stringify(result));
}

function insertEvaluationResult(approachResult, FPEvaluation, DAEvaluation) {
    for (let consequentInfo of approachResult) {
        let consequent = getConsequenceKey(consequentInfo['consequent'])
        if (consequentInfo['status'] != STATUS.removed) {
            if (FPEvaluation[consequent] != undefined) {
                consequentInfo['FP-evaluation'] = FPEvaluation[consequent]
            }

            if (DAEvaluation[consequent] != undefined) {
                consequentInfo['DA-evaluation'] = DAEvaluation[consequent]
            }

            if (FPEvaluation[consequent] == undefined && DAEvaluation[consequent] == undefined) {
                consequentInfo['not-evaluated'] = ""
            }
        }
    }
}

function collectEvaluationResult(reversedData) {
    let result = {}
    for (let antecedent in reversedData) {
        for (let consequentInfo of reversedData[antecedent]) {

            let consequent = getConsequenceKey(consequentInfo['consequent'])
            let evaluationResult = consequentInfo['evaluation result']

            if (result[consequent] == undefined) {
                result[consequent] = evaluationResult
            } else {
                result[consequent] == "true" ? (result[consequent] + evaluationResult).toLowerCase().includes('true') : "false"
            }
        }
    }
    return result
}

function getConsequenceKey(consequentString) {
    return consequentString.split(" | ")[0]
}

module.exports = { collectEvaluationResult, getConsequenceKey }
