const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require("./evaluation.js")
const { unitsContributionToLatex, approachesComparisonToLatex } = require("./utils/jsonToLatexRow")
const capreseName = "berke"
const tarmaqName = "tarmaq"

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
    summarizedResult['units contribution summary'] = unitsContributionSummary(result)
    summarizedResult['approaches data'] = approachesResultSummary(result)
    summarizedResult['units contribution summary latex row'] = unitsContributionToLatex(summarizedResult['units contribution summary'])
    summarizedResult['approaches data latex row'] = approachesComparisonToLatex(summarizedResult['approaches data'])

    return summarizedResult
}

function unitsContributionSummary(result) {
    let minDA = Infinity;
    let maxDA = 0;
    let uniqueDA = 0;

    let minFP = Infinity;
    let maxFP = 0;
    let uniqueFP = 0;

    let totalCommon = 0;
    let avgCommon = 0;

    let DATotalTruePositives = 0;
    let FPTotalTruePositives = 0;

    let DASumOfTruePositivesRatio = 0;
    let FPSumOfTruePositivesRatio = 0;

    let HadDA = 0;
    let HadFP = 0;

    for (let commit in result) {
        let impactSet = result[commit][capreseName]

        let uniqueDACounter = 0;
        let uniqueFPCounter = 0;
        let DATruePositiveCounter = 0;
        let FPTruePositiveCounter = 0;
        let commonCounter = 0;

        impactSet.forEach(consequentInfo => {
            if (consequentInfo["FP-antecedents"] != undefined && consequentInfo["DA-antecedents"] != undefined) {
                commonCounter += 1;
            } else if (consequentInfo["DA-antecedents"] != undefined) {
                uniqueDACounter += 1;
            } else {
                uniqueFPCounter += 1;
            }

            DATruePositiveCounter = increaseIfIsTruePositive(DATruePositiveCounter, consequentInfo['DA-evaluation'])
            FPTruePositiveCounter = increaseIfIsTruePositive(FPTruePositiveCounter, consequentInfo['FP-evaluation'])
        })

        uniqueFP += uniqueFPCounter;
        uniqueDA += uniqueDACounter;
        totalCommon += commonCounter;

        DATotalTruePositives += DATruePositiveCounter
        FPTotalTruePositives += FPTruePositiveCounter

        let DAcounter = uniqueDACounter + commonCounter
        let FPcounter = uniqueFPCounter + commonCounter
        DASumOfTruePositivesRatio += DAcounter ? DATruePositiveCounter / DAcounter : 0 // @TODO not sure it's the right way to have an average of ratios. 
        FPSumOfTruePositivesRatio += FPcounter ? FPTruePositiveCounter / FPcounter : 0

        HadDA += DAcounter ? 1 : 0
        HadFP += FPcounter ? 1 : 0

        minDA = Math.min(minDA, uniqueDACounter)
        maxDA = Math.max(maxDA, uniqueDACounter)

        minFP = Math.min(minFP, uniqueFPCounter)
        maxFP = Math.max(maxFP, uniqueFPCounter)
    }

    let length = Object.keys(result).length


    let avgUniqueDA = uniqueDA / length
    let avgUniqueFP = uniqueFP / length
    avgCommon = totalCommon / length

    let avgDA = avgUniqueDA + avgCommon
    let avgFP = avgUniqueFP + avgCommon

    let avgDATruePositives = DATotalTruePositives / length
    let avgFPTruPositives = FPTotalTruePositives / length


    return {
        "Impact-set size": {
            "DA": JSON.stringify({ "avg": avgDA, "min": minDA, "max": maxDA, "unique": avgUniqueDA }),
            "FP": JSON.stringify({ "avg": avgFP, "min": minFP, "max": maxFP, "unique": avgUniqueFP }),
            "avg common": avgCommon
        },
        "True Positives": {
            "DA": JSON.stringify({ "avg": avgDATruePositives, "avg commit %": DASumOfTruePositivesRatio / HadDA, "total %": avgDATruePositives / avgDA }),
            "FP": JSON.stringify({ "avg": avgFPTruPositives, "avg commit %": FPSumOfTruePositivesRatio / HadFP, "total %": avgFPTruPositives / avgFP })
        }
    };
}

function approachesResultSummary(result) {

    let [capreseImpactSetSizeData, capreseTruePositivesData] = approachSummary(result, capreseName)

    let [tarmaqImpactSetSizeData, tarmaqTruePositivesData] = approachSummary(result, tarmaqName)

    let impactSetSize = {}
    let truePositiveData = {}
    impactSetSize[capreseName] = JSON.stringify(capreseImpactSetSizeData)
    impactSetSize[tarmaqName] = JSON.stringify(tarmaqImpactSetSizeData)
    truePositiveData[capreseName] = JSON.stringify(capreseTruePositivesData)
    truePositiveData[tarmaqName] = JSON.stringify(tarmaqTruePositivesData)

    return {
        "Impact-set size": impactSetSize, "True Positives": truePositiveData
    }
}

function approachSummary(result, approach) {
    let totalImpactSetSize = 0
    let support = 0
    let confidence = 0
    let fpCount = 0;
    let uniquesCount = 0;
    let minSize = Infinity;
    let maxSize = 0;
    let sumOfAveragePrecisions = 0;
    let totalTruePositives = 0;

    let fpSearchKey = approach == capreseName ? "FP-score" : "confidence"

    for (let commit in result) {
        let truePositiveCounter = 0;
        let sumOfPrecisions = 0;
        let impactset = result[commit][approach]
        impactset.forEach((consequentInfo, index) => {
            if (consequentInfo[fpSearchKey]) {
                support += parseInt(consequentInfo["support"])
                confidence += parseFloat(consequentInfo[fpSearchKey])
                fpCount += 1
            }
            if (consequentInfo["status"] != STATUS.common && consequentInfo["status"] != STATUS.removed) {
                uniquesCount += 1
            }

            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['DA-evaluation'] + consequentInfo['FP-evaluation'])

            let precisionSoFar = truePositiveCounter / (index + 1)
            sumOfPrecisions += precisionSoFar
        })


        let impactSetSize = impactset.length;
        minSize = Math.min(minSize, impactSetSize);
        maxSize = Math.max(maxSize, impactSetSize);
        totalImpactSetSize += impactSetSize;

        let averagePrecision = impactSetSize ? sumOfPrecisions / impactSetSize : 0;
        sumOfAveragePrecisions += averagePrecision;
        totalTruePositives += truePositiveCounter;
    }
    let length = Object.keys(result).length

    let impactSetSizeData = {
        "avg": totalImpactSetSize / length,
        "min": minSize,
        "max": maxSize
    }
    let truePositivesData = {
        "Average Precision": sumOfAveragePrecisions / length,
        "Average True Positives": totalTruePositives / length,
        "Average Unique Results": uniquesCount / length,
        "Average FP Support": support / fpCount,
        "Average FP Confidence": confidence / fpCount
    }

    return [impactSetSizeData, truePositivesData]
}

function increaseIfIsTruePositive(totalTruePositives, evaluationResult) {
    if (evaluationResult) {
        let isTruePositive = evaluationResult.toLowerCase().includes('true')
        if (isTruePositive) {
            totalTruePositives += 1
        }
    }
    return totalTruePositives
}

function averageCommitSize(result) {
    let counter = 0;
    let min = Infinity;
    let max = 0;
    for (let commit in result) {
        let commits = result[commit]["commits"]
        let functionsCount = commits.length
        counter += functionsCount
        min = Math.min(min, functionsCount)
        max = Math.max(max, functionsCount)
    }
    let length = Object.keys(result).length
    return { "avg": counter / length, "min": min, "max": max }
}

module.exports = { averageCommitSize }