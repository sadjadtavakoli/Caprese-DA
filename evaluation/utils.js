const menaAveragePrecisionAndRecallOrdering = {
    "caprese": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"] },
    "FPD": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"] },
    "tarmaq": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"] },
    "tarmaq_t": { 5: ["P", "R"], 10: ["P", "R"], 20: ["P", "R"], 30: ["P", "R"], 60: ["P", "R"] }
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

const benchmarksInfoOrdering = ["# Commits", "# Transactions", "# Unique functions", "KLOC", "JS (%)"]


function benchmarksInfoLatexRow(data) {
    return listToLatex(data, benchmarksInfoOrdering)
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
        result += `& ${subtable(data, tableName, columnOrdering)} \\\\\n`
    }
    result = result.substring(1)

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
    getFullTable, unitContributionTruPositivesToLatex, benchmarksInfoLatexRow, meanAveragePrecisionAndRecallLatexRow, meanAveragePrecisionLatexRow
}