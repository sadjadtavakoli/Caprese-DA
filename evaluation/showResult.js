const fs = require("fs")
const path = require("path")
const { benchmarkList, APPROACHES, getDetectedImpactSetPath, getChangeSetPath, STATUS } = require('./evaluationConstants')
const { unitsContributionToLatex, approachesComparisonToLatex, getFullTable, changeSetLatexRow } = require("./utils/jsonToLatexRow")
const capreseName = APPROACHES.caprese
const tarmaqName = APPROACHES.tarmaq

if (process.argv[1].endsWith(path.basename(__filename))) {
    if (process.argv[2]) {
        let { summarizedResult } = summarizeResult(process.argv[2])
        console.log(summarizedResult)
    } else {
        let unitsContributionLatexRows = {}
        let approachesLatexRows = {}
        let changeSetInfoLatexRows = {}
        benchmarkList.forEach(filename => {
            if (fs.statSync(getDetectedImpactSetPath(filename)).isFile()) {
                let { summarizedResult, unitsContributionLatexRow, approachesLatexRow, changeSetInfoLatexRow } = summarizeResult(filename)
                console.log(summarizedResult)
                unitsContributionLatexRows[filename] = unitsContributionLatexRow
                approachesLatexRows[filename] = approachesLatexRow
                changeSetInfoLatexRows[filename] = changeSetInfoLatexRow
            }
        });
        console.log(" === units data === \n", getFullTable(unitsContributionLatexRows))
        console.log(" === approachs data === \n", getFullTable(approachesLatexRows))
        console.log(" === changeSet data === \n", getFullTable(changeSetInfoLatexRows))
    }
}

function average(array) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
}

function summarizeResult(filename) {
    let result = JSON.parse(fs.readFileSync(getDetectedImpactSetPath(filename)));
    let summarizedResult = {}
    let changeSetInfo = averageCommitSize(filename)
    let unitsContribution = unitsContributionSummary(result)
    let approachesData = approachImpactSetSize(result)

    summarizedResult['units data'] = unitsContribution
    summarizedResult['approaches data'] = approachesData
    summarizedResult['changeSet Size'] = changeSetInfo

    let unitsContributionLatexRow = unitsContributionToLatex(unitsContribution)
    let approachesLatexRow = approachesComparisonToLatex(approachesData)
    let changeSetInfoLatexRow = changeSetLatexRow(changeSetInfo)

    return { summarizedResult, unitsContributionLatexRow, approachesLatexRow, changeSetInfoLatexRow }
}

function unitsContributionSummary(result) {
    let uniqueDAList = [];
    let uniqueFPList = [];
    let commonList = [];

    for (let commit in result) {
        let impactSet = result[commit][capreseName]

        let uniqueDA = impactSet.filter(item => item["DA-distance"] != undefined && item["FP-antecedents"] == undefined).length
        let uniqueFP = impactSet.filter(item => item["DA-distance"] == undefined && item["FP-antecedents"] != undefined).length
        let common = impactSet.filter(item => item["DA-distance"] != undefined && item["FP-antecedents"] != undefined).length

        uniqueFPList.push(uniqueFP);
        uniqueDAList.push(uniqueDA);
        commonList.push(common);
    }

    let avgUniqueDA = average(uniqueDAList)
    let avgUniqueFP = average(uniqueFPList)
    let avgCommon = average(commonList)
    let allDA = uniqueDAList.map(function (num, idx) {
        return num + commonList[idx];
    });
    let allFP = uniqueFPList.map(function (num, idx) {
        return num + commonList[idx];
    });

    let totalAverage = (avgUniqueDA + avgUniqueFP + avgCommon).toFixed(2)

    let unigueDAPercentage = (avgUniqueDA / totalAverage * 100).toFixed(2)
    let unigueFPPercentag = (avgUniqueFP / totalAverage * 100).toFixed(2)

    return {
        "Impact-set size": {
            "DA": JSON.stringify({ "avg": average(allDA), "min": Math.min(...allDA), "max": Math.max(...allDA), "unique": avgUniqueDA, "unique/total": unigueDAPercentage }),
            "FP": JSON.stringify({ "avg": average(allFP), "min": Math.min(...allFP), "max": Math.max(...allFP), "unique": avgUniqueFP, "unique/total": unigueFPPercentag })
        }
    };
}

function approachImpactSetSize(result) {

    let capreseImpactSetSizeData = approachSummary(result, capreseName)

    let tarmaqImpactSetSizeData = approachSummary(result, tarmaqName)

    let impactSetSize = {}
    impactSetSize[capreseName] = JSON.stringify(capreseImpactSetSizeData)
    impactSetSize[tarmaqName] = JSON.stringify(tarmaqImpactSetSizeData)

    return {
        "Impact-set size": impactSetSize
    }
}

function approachSummary(result, approach) {
    let impactSetSizes = []
    let uniquesCountList = [];

    for (let commit in result) {
        let impactset = result[commit][approach]
        // impactset = impactset.filter(item=>item['status']!=STATUS.removed)

        let uniquesCount = impactset.filter(item => item['status'] != STATUS.common).length

        impactSetSizes.push(impactset.length)
        uniquesCountList.push(uniquesCount)
    }

    let impactSetSizeData = {
        "avg": average(impactSetSizes),
        "min": Math.min(...impactSetSizes),
        "max": Math.max(...impactSetSizes),
        "unique": average(uniquesCountList)
    }

    return impactSetSizeData
}

function averageCommitSize(filename) {
    let commitSizes = []
    let allChangedEntities = []
    let result = JSON.parse(fs.readFileSync(getChangeSetPath(filename)));
    for (let commit in result) {
        let changes = result[commit]["changes"]
        commitSizes.push(changes.length)
        allChangedEntities = allChangedEntities.concat(changes)
    }
    allChangedEntities = allChangedEntities.filter((item, index) => allChangedEntities.indexOf(item) === index)

    return { "avg": average(commitSizes), "min": Math.min(...commitSizes), "max": Math.max(...commitSizes), "unique": allChangedEntities.length }
}

module.exports = { averageCommitSize, average }