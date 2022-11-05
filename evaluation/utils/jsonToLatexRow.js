const unitsContributionColumnOrdeing = {
    'Impact-set size': {
        DA: ["avg", "min", "max", "std", "unique", "unique/total"],
        FP: ["avg", "min", "max", "std", "unique", "unique/total"]
    },
    'True Positives': {
        DA: ["avg", "precision"],
        FP: ["avg", "precision"],
        total: ["precision"]
    }
}

const approachesDataColumnOrdeing = {
    'Impact-set size': {
        berke: ["avg", "min", "max"],
        tarmaq: ["avg", "min", "max"]
    },
    // 'Impact-set size': {
    //     berke: ["avg", "min", "max", "unique"],
    //     tarmaq: ["avg", "min", "max", "unique"]
    // },

    'True Positives': {
        berke: ["Average True Positives", "Average Precision"],
        tarmaq: ["Average True Positives", "Average Precision"]
    },
    'Execution Time': {
        berke: ["average"],
        tarmaq: ["average"]
    }
}

const menaAveragePrecisionOrdering = {
    "berke": [10, 20, 30, 60, "all"],
    "tarmaq": [10, 20, 30, 60, "all"]
}
const benchmarksInfoOrdering = ["# Commits", "# Change-sequences", "Unique #functions","LOC", "JavaScript Percentage"]
const changeSetInfoOrdering = ["min", "max", "avg"]


function unitsContributionToLatex(data) {
    return toLatex(data, unitsContributionColumnOrdeing)
}

function approachesComparisonToLatex(data) {
    return toLatex(data, approachesDataColumnOrdeing)
}

function benchmarksInfoLatexRow(data) {
    return listToLatex(data, benchmarksInfoOrdering)
}

function changeSetLatexRow(data) {
    return listToLatex(data, changeSetInfoOrdering)
}

function meanAveragePrecisionLatexRow(data) {
    return toLatexOneLevel(data, menaAveragePrecisionOrdering)
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

module.exports = { unitsContributionToLatex, approachesComparisonToLatex, getFullTable, benchmarksInfoLatexRow, changeSetLatexRow, meanAveragePrecisionLatexRow}