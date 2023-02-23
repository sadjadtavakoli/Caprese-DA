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
        let result = {}
        for (let commit in detectedImpactSets) {
            let detectedImpactSet = getRankedResult(detectedImpactSets[commit]["caprese"])
            let _threshold = threshold == "all" ? detectedImpactSet.length : Math.min(threshold, detectedImpactSet.length)
            if (_threshold != 0) {
                let topDetectedImpactSet = detectedImpactSet.splice(0, _threshold)
                let truePositives = topDetectedImpactSet.filter(item => item["evaluation"].toUpperCase().includes("TP"))
                let commonTruePositives = truePositives.filter(item => item['DA-distance'] && item['FP-antecedents'])
                let DATruePositives = truePositives.filter(item => item['DA-distance'] && !item['FP-antecedents'])
                let FPTruePositives = truePositives.filter(item => !item['DA-distance'] && item['FP-antecedents'])
                result['da'] = (DATruePositives.length / truePositives.length * 100).toFixed(2)
                result['fp'] = (FPTruePositives.length / truePositives.length * 100).toFixed(2)
                result['common'] = (commonTruePositives.length / truePositives.length * 100).toFixed(2)
            }
        }
        lapsesOnThresholds[threshold] = result
    }
    return lapsesOnThresholds
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
