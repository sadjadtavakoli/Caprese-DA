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
    for (let threshold of thresholds) {
        lapsesOnThresholds[threshold] = { "da": [], "fp": [], "common": [] }
    }

    let detectedImpactSets = JSON.parse(fs.readFileSync(getDetectedImpactSetPath(filename)));

    for (let commit in detectedImpactSets) {
        let detectedImpactSet = getRankedResult(detectedImpactSets[commit]["caprese"])
        let daTruePositives = 0
        let fpTruePositives = 0
        let commonTruePositives = 0
        let allTruePositives = detectedImpactSet.filter(item => item['status'] != STATUS.removed && item['evaluation'].toUpperCase().includes("TP"))
        for (let i = 0; i < allTruePositives.length; i++) {
            let item = allTruePositives[i]
            if (thresholds.includes(i)) {
                lapsesOnThresholds[i]["da"].push(daTruePositives)
                lapsesOnThresholds[i]["fp"].push(fpTruePositives)
                lapsesOnThresholds[i]["common"].push(commonTruePositives)
            }
            if (item['DA-distance'] && item['FP-antecedents']) {
                commonTruePositives++
            } else if (item['FP-antecedents']) {
                fpTruePositives++
            } else {
                daTruePositives++
            }
        }
        for (let threshold of thresholds) {
            if (threshold == "all" || threshold == allTruePositives.length) {
                lapsesOnThresholds[threshold]["da"].push(daTruePositives)
                lapsesOnThresholds[threshold]["fp"].push(fpTruePositives)
                lapsesOnThresholds[threshold]["common"].push(commonTruePositives)
            } else if (threshold > allTruePositives.length) {
                lapsesOnThresholds[threshold]["da"].push("-")
                lapsesOnThresholds[threshold]["fp"].push("-")
                lapsesOnThresholds[threshold]["common"].push("-")
            }
        }
    }

    for (let [threshold, approaches] of Object.entries(lapsesOnThresholds)) {
        for (let [approach, values] of Object.entries(approaches)) {
            lapsesOnThresholds[threshold][approach] = average(values)
        }
    }
    return lapsesOnThresholds
}

function average(array) {
    let newArray = array.filter(item => item != "-")
    if (!newArray.length) return "-"
    return parseFloat((newArray.reduce((a, b) => a + b) / newArray.length).toFixed(2))
}

function rankFPResult() {
    return function (a, b) {
        if (b['support'] == a['support']) {
            return b['confidence'] - a['confidence'];
        } else {
            return b['support'] - a['support'];
        }
    };
}

function rankDAResult() {
    return function (a, b) {
        return a['DA-distance'] - b['DA-distance']
    };
}

function rankCommonImpactSet() {
    return function (a, b) {

        let aSupport = a['support'];
        let bSupport = b['support'];
        if (aSupport != bSupport) {
            return bSupport - aSupport;
        }

        let aFP = a['confidence'];
        let bFP = b['confidence'];
        if (bFP != aFP) {
            return bFP - aFP;
        }

        return a['DA-distance'] - b['DA-distance'];
    };
}

function getRankedResult(impactSet) {

    let commonImpactSet = [];
    let uniquelyByDA = [];
    let uniquelyByFP = [];
    for (let info of impactSet) {
        if (info['DA-distance'] != undefined && info['FP-antecedents'] != undefined) {
            commonImpactSet.push(info)
        } else if (info['DA-distance'] != undefined) {
            uniquelyByDA.push(info)
        } else {
            uniquelyByFP.push(info)
        }
    }
    commonImpactSet.sort(rankCommonImpactSet())
    uniquelyByDA.sort(rankDAResult())
    uniquelyByFP.sort(rankFPResult())

    let mergedDAandFP = mergeLists(uniquelyByDA, uniquelyByFP)
    return commonImpactSet.concat(mergedDAandFP)


    function mergeLists(list1, list2) {
        let max = Math.max(list1.length, list2.length)
        let min = Math.min(list1.length, list2.length)

        let newList = []

        for (let i = 0; i < min; i += 1) {
            newList.push(list1[i])
            newList.push(list2[i])
        }

        if (list1.length > min) {
            newList = newList.concat(list1.splice(min, max - min))
        }

        if (list2.length > min) {
            newList = newList.concat(list2.splice(min, max - min))
        }
        return newList
    }
}
