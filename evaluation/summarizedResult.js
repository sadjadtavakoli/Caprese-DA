const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require("./evaluation.js")


if (process.argv[2]) {
    console.log(summarizeResult(process.argv[2]))
}else{
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
    summarizedResult['berke_units_contribution'] = unitsContributionSummary(filename)
    summarizedResult['average_commmit_size'] = averageCommitSize(result)
    summarizedResult['berke'] = berkeSummary(result)
    summarizedResult['tarmaq'] = tarmaqSummary(result)
    return summarizedResult
}

function unitsContributionSummary(filename) {
    let fp = 0;
    let da = 0;
    let common = 0;
    let FP_precentage = 0;
    let DA_precentage = 0;
    let commonPrecentage = 0;
    let result = JSON.parse(fs.readFileSync(`${resultDirPath}${filename}${path.sep}units_contribution.json`));
    for (let commit in result) {
        let FP_length = result[commit]["FP"].length
        let da_length = result[commit]["DA"].length
        let commonLength = result[commit]["common"].length
        let total = FP_length + da_length + commonLength
        fp += FP_length;
        da += da_length;
        common += commonLength;
        if(total!=0){
            commonPrecentage += commonLength / total
            FP_precentage += FP_length / total
            DA_precentage += da_length / total    
        }
    }
    let length = Object.keys(result).length
    fp = fp / length
    da = da / length
    common = common / length
    FP_precentage = FP_precentage/length*100
    DA_precentage = DA_precentage/length*100
    commonPrecentage = commonPrecentage/length*100
    return { "average": { "FP": fp, "DA": da, "Common": common }, "precentage": { "FP": FP_precentage, "DA": DA_precentage, "Common": commonPrecentage } };
}

function berkeSummary(result) {
    let impactSetSize = 0
    let support = 0
    let confidence = 0
    let fpCount = 0;
    let uniquesCount = 0;
    for (let commit in result) {
        let berke = result[commit]["berke"]
        impactSetSize += berke.length
        berke.forEach(impacted => {
            if (impacted["FP-score"]) {
                support += parseInt(impacted["support"])
                confidence += parseFloat(impacted["FP-score"])
                fpCount += 1
            }
            if (impacted["status"] == STATUS.berke_unique) {
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

function tarmaqSummary(result) {
    let impactSet_size = 0
    let support = 0
    let confidence = 0
    let uniques_count = 0
    for (let commit in result) {
        let tarmaq = result[commit]["tarmaq"]
        impactSet_size += tarmaq.length
        tarmaq.forEach(impacted => {
            support += parseInt(impacted["support"])
            confidence += parseFloat(impacted["confidence"])
            if (impacted["status"] == STATUS.tarmaq_unique) {
                uniques_count += 1
            }
        })
    }
    let length = Object.keys(result).length
    support = support / impactSet_size
    confidence = confidence / impactSet_size
    impactSet_size = impactSet_size / length
    uniques_count = uniques_count / length
    return { "avarage_impactSet_size": impactSet_size, "average_unique_result": uniques_count, "average_support": support, "average_confidence": confidence }
}

function averageCommitSize(result) {
    let counter = 0;
    for (let commit in result) {
        let commits = result[commit]["commits"]
        counter += commits.length
    }
    let length = Object.keys(result).length
    return counter / length
}