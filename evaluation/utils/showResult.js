const fs = require("fs")
const path = require("path")
const { EXECUTION_TIMES_PATH } = require('../evaluationExecutionTime')
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require("../evaluation.js")
const { unitsContributionToLatex, approachesComparisonToLatex, getFullTable, changeSetLatexRow } = require("./jsonToLatexRow")
const capreseName = "berke"
const tarmaqName = "tarmaq"

if (process.argv[2]) {
    console.log(summarizeResult(process.argv[2]).summarizedResult)
    console.log(summarizeResult(process.argv[2]).unitsContributionLatexRow)
    console.log(summarizeResult(process.argv[2]).approachesLatexRow)
    console.log(summarizeResult(process.argv[2]).changeSetInfoLatexRow)
} else {
    let projects_list = ["eslint-plugin-react", "ws", "cla-assistant", "grant", "markdown-it", "environment", "nodejs-cloudant", "assemble", "express", "session", "jhipster-uml", "neo-async"]

    let unitsContributionLatexRows = {}
    let approachesLatexRows = {}
    let changeSetInfoLatexRows = {}
    projects_list.forEach(filename => {
        if (fs.statSync(`${resultDirPath}${filename}`).isDirectory()) {
            let { summarizedResult, unitsContributionLatexRow, approachesLatexRow, changeSetInfoLatexRow } = summarizeResult(filename)
            console.log(summarizedResult)
            unitsContributionLatexRows[filename] = unitsContributionLatexRow
            approachesLatexRows[filename] = approachesLatexRow
            changeSetInfoLatexRows[filename] = changeSetInfoLatexRow
        }
    });
    console.log(getFullTable(unitsContributionLatexRows))
    console.log(getFullTable(approachesLatexRows))
    console.log(getFullTable(changeSetInfoLatexRows))
}

function summarizeResult(filename) {
    let result = JSON.parse(fs.readFileSync(`${resultDirPath}${filename}${path.sep}results.json`));
    let summarizedResult = {}
    let changeSetInfo = averageCommitSize(result)
    let unitsContribution = unitsContributionSummary(result)
    let approachesData = approachesResultSummary(result, filename)

    summarizedResult['units contribution summary'] = unitsContribution
    summarizedResult['approaches data'] = approachesData
    summarizedResult['changeSet Size'] = changeSetInfo

    let unitsContributionLatexRow = unitsContributionToLatex(unitsContribution)
    let approachesLatexRow = approachesComparisonToLatex(approachesData)
    let changeSetInfoLatexRow = changeSetLatexRow(changeSetInfo)

    return { summarizedResult, unitsContributionLatexRow, approachesLatexRow, changeSetInfoLatexRow }
}

function unitsContributionSummary(result) {
    let minDA = Infinity;
    let maxDA = 0;
    let uniqueDA = 0;

    let minFP = Infinity;
    let maxFP = 0;
    let uniqueFP = 0;

    let totalCommon = 0;

    let DATotalTruePositives = 0;
    let FPTotalTruePositives = 0;

    let DASumOfPrecisions = 0;
    let FPSumOfPrecisions = 0;
    let totalSumOfPrecisions = 0;

    let HadDA = 0;
    let HadFP = 0;
    let HadAny = 0;

    for (let commit in result) {
        let impactSet = result[commit][capreseName]

        let uniqueDACounter = 0;
        let uniqueFPCounter = 0;
        let DATruePositiveCounter = 0;
        let FPTruePositiveCounter = 0;
        let TotalTruePositiveCounter = 0;
        let commonCounter = 0;

        impactSet.forEach(consequentInfo => {
            if (consequentInfo["FP-antecedents"] != undefined && consequentInfo["DA-antecedents"] != undefined) {
                commonCounter += 1;
            } else if (consequentInfo["DA-antecedents"] != undefined) {
                uniqueDACounter += 1;
            } else if (consequentInfo["FP-antecedents"] != undefined){
                uniqueFPCounter += 1;
            }

            DATruePositiveCounter = increaseIfIsTruePositive(DATruePositiveCounter, consequentInfo['DA-evaluation'])
            FPTruePositiveCounter = increaseIfIsTruePositive(FPTruePositiveCounter, consequentInfo['FP-evaluation'])
            TotalTruePositiveCounter = increaseIfIsTruePositive(TotalTruePositiveCounter, consequentInfo['FP-evaluation'] + " " + consequentInfo['DA-evaluation'])
        })

        uniqueFP += uniqueFPCounter;
        uniqueDA += uniqueDACounter;
        totalCommon += commonCounter;

        DATotalTruePositives += DATruePositiveCounter
        FPTotalTruePositives += FPTruePositiveCounter

        let DAcounter = uniqueDACounter + commonCounter
        let FPcounter = uniqueFPCounter + commonCounter
        let totalCounter = uniqueFPCounter + commonCounter + uniqueDACounter
        DASumOfPrecisions += DAcounter ? DATruePositiveCounter / DAcounter : 0 // @TODO not sure it's the right way to have an average of ratios. 
        FPSumOfPrecisions += FPcounter ? FPTruePositiveCounter / FPcounter : 0
        totalSumOfPrecisions += totalCounter ? TotalTruePositiveCounter / totalCounter : 0

        HadDA += DAcounter ? 1 : 0
        HadFP += FPcounter ? 1 : 0
        HadAny += totalCounter ? 1 : 0

        minDA = Math.min(minDA, uniqueDACounter)
        maxDA = Math.max(maxDA, uniqueDACounter)

        minFP = Math.min(minFP, uniqueFPCounter)
        maxFP = Math.max(maxFP, uniqueFPCounter)
    }

    let length = Object.keys(result).length


    let avgUniqueDA = uniqueDA / length
    let avgUniqueFP = uniqueFP / length
    let avgCommon = totalCommon / length

    let avgDA = avgUniqueDA + avgCommon
    let avgFP = avgUniqueFP + avgCommon
    let totalAverage = avgUniqueDA + avgUniqueFP + avgCommon

    let unigueDAPercentage = (avgUniqueDA / totalAverage * 100).toFixed(2)
    let unigueFPPercentag = (avgUniqueFP / totalAverage * 100).toFixed(2)

    avgUniqueDA = avgUniqueDA.toFixed(1)
    avgUniqueFP = avgUniqueFP.toFixed(1)
    // avgCommon = avgCommon.toFixed(1)

    let avgDATruePositives = (DATotalTruePositives / length).toFixed(1)
    let avgFPTruPositives = (FPTotalTruePositives / length).toFixed(1)

    let DAmeanPrecision = (DASumOfPrecisions / HadDA).toFixed(2)
    let FPmeanPrecision = (FPSumOfPrecisions / HadFP).toFixed(2)
    let totalMeanPrecision = (totalSumOfPrecisions / HadAny).toFixed(2)

    avgDA = avgDA.toFixed(1)
    avgFP = avgFP.toFixed(1)

    return {
        "Impact-set size": {
            "DA": JSON.stringify({ "avg": avgDA, "min": minDA, "max": maxDA, "unique": avgUniqueDA, "unique/total": unigueDAPercentage }),
            "FP": JSON.stringify({ "avg": avgFP, "min": minFP, "max": maxFP, "unique": avgUniqueFP, "unique/total": unigueFPPercentag })
        },
        "True Positives": {
            "DA": JSON.stringify({ "avg": avgDATruePositives, "precision": DAmeanPrecision }),
            "FP": JSON.stringify({ "avg": avgFPTruPositives, "precision": FPmeanPrecision }),
            "total": JSON.stringify({ "avg": "-", "precision": totalMeanPrecision })
        }
    };
}

function approachesResultSummary(result, projectName) {

    let [capreseImpactSetSizeData, capreseTruePositivesData] = approachSummary(result, capreseName)

    let [tarmaqImpactSetSizeData, tarmaqTruePositivesData] = approachSummary(result, tarmaqName)

    let executionTime = getExecutionTimes(projectName)

    let impactSetSize = {}
    let truePositiveData = {}
    impactSetSize[capreseName] = JSON.stringify(capreseImpactSetSizeData)
    impactSetSize[tarmaqName] = JSON.stringify(tarmaqImpactSetSizeData)
    truePositiveData[capreseName] = JSON.stringify(capreseTruePositivesData)
    truePositiveData[tarmaqName] = JSON.stringify(tarmaqTruePositivesData)
    executionTime[capreseName] = JSON.stringify(executionTime[capreseName])
    executionTime[tarmaqName] = JSON.stringify(executionTime[tarmaqName])

    return {
        "Impact-set size": impactSetSize, "True Positives": truePositiveData, "Execution Time": executionTime
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
        // impactset = impactset.filter(item=>item['status']!=STATUS.removed)
        impactset.sort(rankResult())

        impactset.forEach((consequentInfo, index) => {
            if (consequentInfo[fpSearchKey]) {
                support += parseInt(consequentInfo["support"])
                confidence += parseFloat(consequentInfo[fpSearchKey])
                fpCount += 1
            }
            if (consequentInfo["status"] != STATUS.common) {
                uniquesCount += 1
            }

            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['DA-evaluation'] + " " + consequentInfo['FP-evaluation'])

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
        "avg": (totalImpactSetSize / length).toFixed(1),
        "min": minSize,
        "max": maxSize,
        "unique": (uniquesCount / length).toFixed(1)
    }
    let truePositivesData = {
        "Average True Positives": (totalTruePositives / length).toFixed(1),
        "Average Precision": (sumOfAveragePrecisions / length).toFixed(2),
        "Average FP Support": (support / fpCount).toFixed(1),
        "Average FP Confidence": (confidence / fpCount).toFixed(1)
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
    return { "avg": (counter / length).toFixed(1), "min": min, "max": max }
}

function getExecutionTimes(projectName) {
    let executionTimes = JSON.parse(fs.readFileSync(EXECUTION_TIMES_PATH));
    executionTimes[projectName][tarmaqName]['average'] = (executionTimes[projectName][tarmaqName]['average'] / 1000).toFixed(2)
    executionTimes[projectName][capreseName]['average'] = (executionTimes[projectName][capreseName]['average'] / 1000).toFixed(2)
    return executionTimes[projectName]
}
module.exports = { averageCommitSize }

    function rankResult() {
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