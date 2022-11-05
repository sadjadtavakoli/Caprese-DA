const fs = require("fs")
const path = require("path")
const { EXECUTION_TIMES_PATH } = require('./evaluationExecutionTime')
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require("../evaluation.js")
const { unitsContributionToLatex, approachesComparisonToLatex, getFullTable, changeSetLatexRow } = require("./jsonToLatexRow")
const capreseName = "berke"
const tarmaqName = "tarmaq"

if (process.argv[1].endsWith(path.basename(__filename))) {
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
                // console.log(summarizedResult)
                unitsContributionLatexRows[filename] = unitsContributionLatexRow
                approachesLatexRows[filename] = approachesLatexRow
                changeSetInfoLatexRows[filename] = changeSetInfoLatexRow
            }
        });
        console.log(getFullTable(unitsContributionLatexRows))
        console.log(getFullTable(approachesLatexRows))
        console.log(getFullTable(changeSetInfoLatexRows))
    }
}

function average(array) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
}

function getStandardDeviation(array) {
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return parseFloat(Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n).toFixed(2))
}

function summarizeResult(filename) {
    console.log(filename)
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
    console.log(" * * * * * * * ")
    let uniqueDA = [];
    let uniqueFP = [];
    let commons = [];

    let DATotalTruePositives = [];
    let FPTotalTruePositives = [];

    let DAPrecisions = [];
    let FPPrecisions = [];
    let totalPrecisions = [];

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
            } else if (consequentInfo["FP-antecedents"] != undefined) {
                uniqueFPCounter += 1;
            }

            DATruePositiveCounter = increaseIfIsTruePositive(DATruePositiveCounter, consequentInfo['DA-evaluation'])
            FPTruePositiveCounter = increaseIfIsTruePositive(FPTruePositiveCounter, consequentInfo['FP-evaluation'])
            TotalTruePositiveCounter = increaseIfIsTruePositive(TotalTruePositiveCounter, consequentInfo['FP-evaluation'] + " " + consequentInfo['DA-evaluation'])
        })

        uniqueFP.push(uniqueFPCounter);
        uniqueDA.push(uniqueDACounter);
        commons.push(commonCounter);

        DATotalTruePositives.push(DATruePositiveCounter)
        FPTotalTruePositives.push(FPTruePositiveCounter)

        let DAcounter = uniqueDACounter + commonCounter
        let FPcounter = uniqueFPCounter + commonCounter
        let totalCounter = uniqueFPCounter + commonCounter + uniqueDACounter

        let DAprecision = DATruePositiveCounter / DAcounter // @TODO not sure it's the right way to have an average of ratios. 
        if (DAcounter) DAPrecisions.push(DAprecision)
        let FPprecision = FPTruePositiveCounter / FPcounter
        if (FPcounter) FPPrecisions.push(FPprecision)
        let totalPrecision = TotalTruePositiveCounter / totalCounter
        if (totalCounter) totalPrecisions.push(totalPrecision)

    }

    let avgUniqueDA = average(uniqueDA)
    let avgUniqueFP = average(uniqueFP)
    let avgCommon = average(commons)
    let allDA = uniqueDA.map(function (num, idx) {
        return num + commons[idx];
    });
    let allFP = uniqueFP.map(function (num, idx) {
        return num + commons[idx];
    });
    
    let totalAverage = (avgUniqueDA + avgUniqueFP + avgCommon).toFixed(2)

    let unigueDAPercentage = (avgUniqueDA / totalAverage * 100).toFixed(2)
    let unigueFPPercentag = (avgUniqueFP / totalAverage * 100).toFixed(2)

    return {
        "Impact-set size": {
            "DA": JSON.stringify({ "avg": average(allDA), "min": Math.min(...allDA), "max": Math.max(...allDA), "unique": avgUniqueDA, "std": getStandardDeviation(allDA), "unique/total": unigueDAPercentage }),
            "FP": JSON.stringify({ "avg": average(allFP), "min": Math.min(...allFP), "max": Math.max(...allFP), "unique": avgUniqueFP, "std": getStandardDeviation(allFP), "unique/total": unigueFPPercentag })
        },
        "True Positives": {
            "DA": JSON.stringify({ "avg": average(DATotalTruePositives), "precision": average(DAPrecisions) }),
            "FP": JSON.stringify({ "avg": average(FPTotalTruePositives), "precision": average(FPPrecisions) }),
            "total": JSON.stringify({ "avg": "-", "precision": average(totalPrecisions) })
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
    let supports = []
    let confidences = []
    let impactSetSizes = []
    let averagePrecisions = [];
    let totalTruePositives = [];
    let uniquesCount = 0;

    let fpSearchKey = approach == capreseName ? "FP-score" : "confidence"

    for (let commit in result) {
        let truePositiveCounter = 0;
        let sumOfPrecisions = 0;
        let impactset = result[commit][approach]
        // impactset = impactset.filter(item=>item['status']!=STATUS.removed)
        impactset.sort(rankResult())

        impactset.forEach((consequentInfo, index) => {
            if (consequentInfo[fpSearchKey]) {
                supports.push(parseInt(consequentInfo["support"]))
                confidences.push(parseFloat(consequentInfo[fpSearchKey]))
            }
            if (consequentInfo["status"] != STATUS.common) {
                uniquesCount += 1
            }

            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['DA-evaluation'] + " " + consequentInfo['FP-evaluation'])

            let precisionSoFar = truePositiveCounter / (index + 1)
            sumOfPrecisions += precisionSoFar
        })


        let impactSetSize = impactset.length;
        impactSetSizes.push(impactSetSize)

        let averagePrecision = impactSetSize ? sumOfPrecisions / impactSetSize : 0;
        if(impactSetSize) averagePrecisions.push(averagePrecision);
        totalTruePositives.push(truePositiveCounter);
    }
    let length = Object.keys(result).length

    let impactSetSizeData = {
        "avg": average(impactSetSizes),
        "min": Math.min(...impactSetSizes),
        "max": Math.max(...impactSetSizes),
        "unique": (uniquesCount / length).toFixed(1)
    }
    let truePositivesData = {
        "Average True Positives": average(totalTruePositives),
        "Average Precision": average(averagePrecisions),
        "Average FP Support": average(supports),
        "Average FP Confidence": average(confidences)
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
module.exports = { averageCommitSize, average }

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
