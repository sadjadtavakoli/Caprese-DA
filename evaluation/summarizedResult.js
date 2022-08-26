const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require("./evaluation.js")
const { averageCommitSize } = require("./showResult")

if (process.argv[2]) {
    console.log(summarizeResult(process.argv[2]))
} else {
    let finalResult = {}
    fs.readdirSync(resultDirPath).forEach(filename => {
        if (fs.statSync(`${resultDirPath}${filename}`).isDirectory()) {
            finalResult[filename] = summarizeResult(filename)
        }
    });
    console.log(finalResult)
}

function summarizeResult(filename) {
    let result = JSON.parse(fs.readFileSync(`${resultDirPath}${filename}${path.sep}results.json`));
    let summarizedResult = {}
    summarizedResult['changeSet Size'] = averageCommitSize(result)
    summarizedResult['berke_units_contribution'] = unitsContributionSummary(result)
    summarizedResult['berke'] = approachSummary(result, "berke")
    summarizedResult['tarmaq'] = approachSummary(result, "tarmaq")
    return summarizedResult
}

function unitsContributionSummary(result) {
    let fp = 0;
    let da = 0;
    let common = 0;
    for (let commit in result) {
        let DACounter = 0
        let FPCounter = 0
        let commonCounter = 0
        let impactSet = result[commit]["berke"]
        impactSet.forEach(consequentInfo => {
            if (consequentInfo["FP-antecedents"] != undefined && consequentInfo["DA-antecedents"] != undefined) {
                commonCounter += 1;
            } else if (consequentInfo["DA-antecedents"] != undefined) {
                DACounter += 1;
            } else {
                FPCounter += 1;
            }
        })
        fp += FPCounter;
        da += DACounter;
        common += commonCounter;
    }
    let length = Object.keys(result).length
    fp = fp / length
    da = da / length
    common = common / length
    return { "average": { "FP": fp, "DA": da, "Common": common } };
}

function approachSummary(result, approach) {
    let impactSetSize = 0
    let support = 0
    let confidence = 0
    let fpCount = 0;
    let uniquesCount = 0;
    let fpKey = approach == "berke" ? "FP-score" : "confidence"
    for (let commit in result) {
        let berke = result[commit][approach]
        impactSetSize += berke.length
        berke.forEach(impacted => {
            if (impacted[fpKey]) {
                support += parseInt(impacted["support"])
                confidence += parseFloat(impacted[fpKey])
                fpCount += 1
            }
            if (impacted["status"] != STATUS.common && impacted["status"] != STATUS.removed) {
                uniquesCount += 1
            }
        })
    }
    let length = Object.keys(result).length
    support = support / fpCount
    confidence = confidence / fpCount
    impactSetSize = impactSetSize / length
    uniquesCount = uniquesCount / length
    return { "avarage_impactSet_size": impactSetSize, "average_unique_result": uniquesCount, "average_fp_support": support, "average_fp_confidence": confidence }
}