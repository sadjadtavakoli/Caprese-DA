const fs = require("fs")
const { unitContributionTruPositivesToLatex, getFullTable } = require("./utils")
const { benchmarkList, getDetectedImpactSetResultsPath } = require('./evaluationConstants')

let result = {}
let thresholds = [5, 10, 20, 30, 60]
let latexRows = {}
benchmarkList.forEach(filename => {
    let contribution = getContribution(filename)
    result[filename] = contribution
    latexRows[filename] = unitContributionTruPositivesToLatex(contribution)
})

console.log("\n ==== results as json === \n")
console.log(result)
console.log("\n ==== latex table === \n")
console.log(getFullTable(latexRows))

function getContribution(filename) {
    let lapsesOnThresholds = {}
    for (let threshold of thresholds) {
        let detectedImpactSets = JSON.parse(fs.readFileSync(getDetectedImpactSetResultsPath(filename)));
        let result = { 'DA': [], 'FPD': [], 'common': [] }
        for (let commit in detectedImpactSets) {
            let detectedImpactSet = detectedImpactSets[commit]["caprese"]
            let _threshold = Math.min(threshold, detectedImpactSet.length)
            if (_threshold != 0) {
                let topDetectedImpactSet = detectedImpactSet.splice(0, _threshold)
                let truePositives = topDetectedImpactSet.filter(item => item["evaluation"].toUpperCase().includes("TP"))
                if (truePositives.length) {
                    let commonTruePositives = truePositives.filter(item => item['DA-distance'] && item['FPD-antecedents'])
                    let DATruePositives = truePositives.filter(item => item['DA-distance'] && !item['FPD-antecedents'])
                    let FPTruePositives = truePositives.filter(item => !item['DA-distance'] && item['FPD-antecedents'])
                    result['DA'].push(DATruePositives.length / truePositives.length * 100)
                    result['FPD'].push(FPTruePositives.length / truePositives.length * 100)
                    result['common'].push(commonTruePositives.length / truePositives.length * 100)
                }
            }
        }
        lapsesOnThresholds[threshold] = { 'DA': average(result['DA']), 'FPD': average(result['FPD']), 'common': average(result['common']) }
    }
    return lapsesOnThresholds
}

function average(array) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
}