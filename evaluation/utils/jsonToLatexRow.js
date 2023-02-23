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
    DA: ["average"],
    FP: ["average"],
    caprese: ["average"],
    tarmaq: ["average"]
}

const menaAveragePrecisionOrdering = {
    "tarmaq": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"], "all": ["P", "R"] },
    "caprese": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"], "all": ["P", "R"] },
    "fp": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"], "all": ["P", "R"] },
    "da": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"], "all": ["P", "R"] }
}

const unitContributionTrupositivesOrdering = {
    5: ["da", "fp", "common"],
    10: ["da", "fp", "common"],
    20: ["da", "fp", "common"],
    30: ["da", "fp", "common"],
    60: ["da", "fp", "common"],
    "all": ["da", "fp", "common"]
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

function meanAveragePrecisionLatexRow(data) {
    return toLatex(data, menaAveragePrecisionOrdering)
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
    benchmarksInfoLatexRow, changeSetLatexRow, meanAveragePrecisionLatexRow, executionTimeToLatex
}