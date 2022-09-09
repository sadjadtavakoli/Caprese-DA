const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require('../evaluation')

let projectName = ""
let fileName = ""
let lineNumbers = []
let lines = lineNumbers.map(item => fileName + "-" + item)

addEvaluationResult("ts")
// addEvaluationResultBasedONFule("fs")

function addEvaluationResult(evaluationResult) {
    const RESULT_PATH = `${resultDirPath}${projectName}${path.sep}singleCommit.json`
    let result = JSON.parse(fs.readFileSync(RESULT_PATH));

    let reversedFP = result['reversed-FP']
    let reversedDA = result['reversed-DA']

    for (let antecedent in reversedFP) {
        for (let consequentInfo of reversedFP[antecedent]) {
            let consequent = getConsequenceKey(consequentInfo['consequent'])
            if (lines.includes(consequent)) {
                consequentInfo['evaluation result'] = evaluationResult
            }
        }
    }

    for (let antecedent in reversedDA) {
        for (let consequentInfo of reversedDA[antecedent]) {
            let consequent = getConsequenceKey(consequentInfo['consequent'])
            if (lines.includes(consequent)) {
                consequentInfo['evaluation result'] = evaluationResult
            }
        }
    }
    fs.writeFileSync(RESULT_PATH, JSON.stringify(result));
}

function addEvaluationResultBasedONFule(evaluationResult) {
    const RESULT_PATH = `${resultDirPath}${projectName}${path.sep}singleCommit.json`
    let result = JSON.parse(fs.readFileSync(RESULT_PATH));

    let reversedFP = result['reversed-FP']
    let reversedDA = result['reversed-DA']

    for (let antecedent in reversedFP) {
        for (let consequentInfo of reversedFP[antecedent]) {
            let consequent = getConsequenceFileName(consequentInfo['consequent'])
            if (fileName == consequent && consequentInfo['evaluation result'] == "")
                consequentInfo['evaluation result'] = evaluationResult
        }
    }

    for (let antecedent in reversedDA) {
        for (let consequentInfo of reversedDA[antecedent]) {
            let consequent = getConsequenceFileName(consequentInfo['consequent'])
            if (fileName == consequent && consequentInfo['evaluation result'] == "")
                consequentInfo['evaluation result'] = evaluationResult
        }
    }
    fs.writeFileSync(RESULT_PATH, JSON.stringify(result));
}


function getConsequenceKey(consequentString) {
    let items = consequentString.split(" | ")[0].split("-")
    items.pop()
    items.shift()
    let item = items.join("-")
    console.log(item)
    return item
}

function getConsequenceFileName(consequentString) {
    let items = consequentString.split(" | ")[0].split("-")
    items.pop()
    items.pop()
    items.shift()
    let item = items.join("-")
    console.log(item)
    return item
}