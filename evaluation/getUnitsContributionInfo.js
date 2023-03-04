const fs = require("fs")
const { unitContributionTruPositivesToLatex, getFullTable } = require("./utils/jsonToLatexRow")
const { benchmarkList, getDetectedImpactSetPath, STATUS } = require('./evaluationConstants')

let result = {}
let thresholds = [5, 10, 20, 30, 60, "all"]
let latexRows = {}
benchmarkList.forEach(filename => {
    let contribution = getContribution(filename)
    result[filename] = contribution
    latexRows[filename] = unitContributionTruPositivesToLatex(contribution)
})

console.log(getFullTable(latexRows))

function getContribution(filename) {
    let lapsesOnThresholds = {}
    let detectedImpactSets = JSON.parse(fs.readFileSync(getDetectedImpactSetPath(filename)));
    for (let threshold of thresholds) {
        let result = { 'da': [], 'fp': [], 'common': [] }
        for (let commit in detectedImpactSets) {
            let detectedImpactSet = detectedImpactSets[commit]["caprese"]
            let _threshold = threshold == "all" ? detectedImpactSet.length : Math.min(threshold, detectedImpactSet.length)
            if (_threshold != 0) {
                let topDetectedImpactSet = detectedImpactSet.splice(0, _threshold)
                let truePositives = topDetectedImpactSet.filter(item => item["evaluation"].toUpperCase().includes("TP"))
                if (truePositives.length) {
                    let commonTruePositives = truePositives.filter(item => item['DA-distance'] && item['FP-antecedents'])
                    let DATruePositives = truePositives.filter(item => item['DA-distance'] && !item['FP-antecedents'])
                    let FPTruePositives = truePositives.filter(item => !item['DA-distance'] && item['FP-antecedents'])
                    result['da'].push(DATruePositives.length / truePositives.length * 100)
                    result['fp'].push(FPTruePositives.length / truePositives.length * 100)
                    result['common'].push(commonTruePositives.length / truePositives.length * 100)
                }
            }
        }
        console.log(result)
        lapsesOnThresholds[threshold] = { 'da': average(result['da']), 'fp': average(result['fp']), 'common': average(result['common']) }
    }
    return lapsesOnThresholds
}

function average(array) {
    return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
}