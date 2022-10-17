const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require('./evaluation')

let projects_list = ["eslint-plugin-react", "ws", "cla-assistant", "grant", "markdown-it", "environment", "nodejs-cloudant", "assemble", "express", "session", "jhipster-uml", "neo-async"]

projects_list.forEach(filename => {
    addEvaluationResult(filename)
})

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
                if (FPEvaluation[consequent] != undefined) {
                    consequentInfo['FP-evaluation'] = FPEvaluation[consequent]
                }else if (DAEvaluation[consequent] != undefined){
                    consequentInfo['DA-evaluation'] = DAEvaluation[consequent]
                }else if(consequentInfo['status'] != STATUS.tarmaq_unique){
                    consequentInfo['not-evaluated'] = ""
                }
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
                result[consequent] == "true" ?  (result[consequent] + evaluationResult).toLowerCase().includes('true') : "false"
            }
        }
    }
    return result
}

function getConsequenceKey(consequentString) {
    return consequentString.split(" | ")[0]
}
