const unitsContributionColumnOrdeing = {
    'Impact-set size': {
        DA: ["avg", "min", "max", "unique", "unique/total"],
        FP: ["avg", "min", "max", "unique", "unique/total"]
    }
}

const approachesDataColumnOrdeing = {
    'Impact-set size': {
        caprese: ["avg", "min", "max", "unique"],
        tarmaq: ["avg", "min", "max", "unique"]
    }
}
const executionTimeColumnOrdeing = {
    DA: ["average", "original", "overHead"],
    caprese: ["average"],
    FP: ["average"],
    tarmaq: ["average"]
}

const menaAveragePrecisionAndRecallOrdering = {
    "tarmaq_t": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"] },
    "tarmaq": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"] },
    "caprese": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"] },
    "FPD": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"] },
}

const menaAveragePrecisionOrdering = {
    "caprese": [5, 10, 20, 30, 60],
    "FPD": [5, 10, 20, 30, 60],
    "DA": [5, 10, 20, 30, 60]
}

const unitContributionTrupositivesOrdering = {
    5: ["DA", "FPD", "common"],
    10: ["DA", "FPD", "common"],
    20: ["DA", "FPD", "common"],
    30: ["DA", "FPD", "common"],
    60: ["DA", "FPD", "common"]
}

const benchmarksInfoOrdering = ["# Commits", "# Change-sequences", "Unique #functions", "Avg # functions in commit", "LOC", "JavaScript Percentage", "languages"]
const changeSetInfoOrdering = ["min", "max", "avg"]


function unitsContributionToLatex(data) {
    return toLatex(data, unitsContributionColumnOrdeing)
}

function approachesComparisonToLatex(data) {
    return toLatex(data, approachesDataColumnOrdeing)
}

function executionTimeToLatex(data) {
    return toLatexOneLevel(data, executionTimeColumnOrdeing)
}

function benchmarksInfoLatexRow(data) {
    return listToLatex(data, benchmarksInfoOrdering)
}

function changeSetLatexRow(data) {
    return listToLatex(data, changeSetInfoOrdering)
}

function meanAveragePrecisionAndRecallLatexRow(data) {
    return toLatex(data, menaAveragePrecisionAndRecallOrdering)
}

function meanAveragePrecisionLatexRow(data) {
    return toLatexOneLevel(data, menaAveragePrecisionOrdering)
}

function unitContributionTruPositivesToLatex(data) {
    return toLatexOneLevel(data, unitContributionTrupositivesOrdering)
}

function listToLatex(data, columnOrdering) {
    let result = ``
    for (let item of columnOrdering) {
        result += `${data[item]} & `
    }
    return result.slice(0, -3)
}

function toLatex(data, columnOrdering) {
    let result = ``
    for (let tableName in columnOrdering) {
        result += `${subtable(data, tableName, columnOrdering)} & `
    }

    return result.slice(0, -3)
}

function toLatexOneLevel(data, columnOrdering) {
    let result = ``
    for (let tableName in columnOrdering) {
        result += `${subtableOneLevel(data, tableName, columnOrdering)} & `
    }

    return result.slice(0, -3)
}

function subtable(data, tableName, columnOrdering) {
    let result = ``
    for (let subTableName in columnOrdering[tableName]) {
        result += `${secondLevelSubTable(data, tableName, subTableName, columnOrdering)} & `
    }

    return result.slice(0, -3)
}

function subtableOneLevel(data, tableName, columnOrdering) {
    let result = ``

    columnOrdering[tableName].forEach(element => {
        result += `${data[tableName][element]} & `
    });

    return result.slice(0, -3)
}

function secondLevelSubTable(data, tableName, subtableName, columnOrdering) {
    let result = ``
    columnOrdering[tableName][subtableName].forEach(element => {
        let jsonData = JSON.parse(data[tableName][subtableName]);
        result += `${jsonData[element]} & `
    });
    return result.slice(0, -3)
}

function getFullTable(projectsData) {
    let finalTable = ""
    for (let project in projectsData) {
        finalTable += `${project} & ${projectsData[project]} \\\\ \n`
    }
    return finalTable
}

module.exports = {
    unitsContributionToLatex, approachesComparisonToLatex, getFullTable, unitContributionTruPositivesToLatex,
    benchmarksInfoLatexRow, changeSetLatexRow, meanAveragePrecisionAndRecallLatexRow, executionTimeToLatex, meanAveragePrecisionLatexRow
}