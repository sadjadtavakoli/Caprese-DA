const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`


summarizeResult(process.argv[2])

function summarizeResult(filename) {
    const RESULT_PATH = `${resultDirPath}${filename}${path.sep}results.json`
    let result = JSON.parse(fs.readFileSync(RESULT_PATH));

    for (let commit in result) {
        let reversedFP = result[commit]['reversed-FP']
        let reversedDA = result[commit]['reversed-DA']
        let berke = result[commit]['berke']

        let FPEvaluation = collectEvaluationResult(reversedFP)
        let DAEvaluation = collectEvaluationResult(reversedDA)


        for (let consequentInfo of berke) {
            let consequent = consequentInfo['consequent']
            if (FPEvaluation[consequent] != undefined) {
                consequentInfo['FP-evaluation'] = FPEvaluation[consequent]
            }
            
            if (DAEvaluation[consequent] != undefined) {
                consequentInfo['DA-evaluation'] = DAEvaluation[consequent]
            }
        }
    }
    
    fs.writeFileSync(RESULT_PATH, JSON.stringify(result));
}

function collectEvaluationResult(reversedData) {
    let result = {}
    for (let antecedent in reversedData) {
        for (let consequentInfo of reversedData[antecedent]) {
            let consequent = consequentInfo['consequent'].replaceAll('"', '\"')
            let evaluationResult = consequentInfo['evaluation result']
            if (result[consequent] != undefined) {
                result[consequent] += " | " + evaluationResult
            } else {
                result[consequent] = evaluationResult
            }
        }

        // let status = consequentInfo['status']
        // // if its status was "common" that means its also for TARMAQ
        // if(status==STATUS.common){
        //     if(TARMAQEvaluation[consequent]!=undefined){
        //         TARMAQEvaluation[consequent] += " | " + "evaluationResult"
        //     }else{
        //         TARMAQEvaluation[consequent] = "evaluationResult"
        //     }   
        // }
    }
    return result
}

