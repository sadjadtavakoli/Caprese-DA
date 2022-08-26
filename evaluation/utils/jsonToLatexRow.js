const unitsContributionColumnOrdeing = {
    'Impact-set size': {
        DA: ["avg", "min", "max", "unique"],
        FP: ["avg", "min", "max", "unique"]
    },
    'True Positives': {
        DA: ["avg", "total %"],
        FP: ["avg", "total %"]
    }
}

const approachesDataColumnOrdeing = {
    'Impact-set size': {
        berke: ["avg", "min", "max"],
        tarmaq: ["avg", "min", "max"]
    },
    'True Positives': {
        berke: ["Average True Positives", "Average Precision"],
        tarmaq: ["Average True Positives", "Average Precision"]
    }
}


function unitsContributionToLatex(data) {
    return toLatex(data, unitsContributionColumnOrdeing)
}

function approachesComparisonToLatex(data) {
    return toLatex(data, approachesDataColumnOrdeing)
}

function toLatex(data, columnOrdering) {
    let result = ``
    for (let tableName in columnOrdering) {
        result += `${subtable(data, tableName, columnOrdering)} & `
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

function secondLevelSubTable(data, tableName, subtableName, columnOrdering) {
    let result = ``
    columnOrdering[tableName][subtableName].forEach(element => {
        let jsonData = JSON.parse(data[tableName][subtableName]);
        result += `${jsonData[element]} & `
    });
    return result.slice(0, -3)
}

module.exports = { unitsContributionToLatex, approachesComparisonToLatex }