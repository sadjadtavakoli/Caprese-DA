const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require('./evaluation')

addEvaluationResult(process.argv[2])

function addEvaluationResult(filename) {
    const RESULT_PATH = `${resultDirPath}${filename}${path.sep}results.json`
    let result = JSON.parse(fs.readFileSync(RESULT_PATH));

    for (let commit in result) {
        let reversedFP = result[commit]['reversed-FP']
        let reversedDA = result[commit]['reversed-DA']
        let berke = result[commit]['berke']
        let tarmaq = result[commit]['tarmaq']

        let FPEvaluation = collectEvaluationResult(reversedFP)
        let DAEvaluation = collectEvaluationResult(reversedDA)

        for (let consequentInfo of berke) {
            let consequent = getConsequenceKey(consequentInfo['consequent'])
            if (FPEvaluation[consequent] != undefined) {
                consequentInfo['FP-evaluation'] = FPEvaluation[consequent]
            }

            if (DAEvaluation[consequent] != undefined) {
                consequentInfo['DA-evaluation'] = DAEvaluation[consequent]
            }

            if(FPEvaluation[consequent] == undefined && DAEvaluation[consequent] == undefined){
                consequentInfo['not-evaluated'] = ""
            }
        }

        for (let consequentInfo of tarmaq) {
            let consequent = getConsequenceKey(consequentInfo['consequent'])
            if (consequentInfo['status'] != STATUS.removed) {
                consequentInfo['FP-evaluation'] = FPEvaluation[consequent]
            }
        }
    }

    fs.writeFileSync(RESULT_PATH, JSON.stringify(result));
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
                result[consequent] += " | " + evaluationResult
            }
        }
    }
    return result
}

function getConsequenceKey(consequentString) {
    return consequentString.split(" | ")[0]
}
