const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`

let projects_list = ["eslint-plugin-react","ws","cla-assistant","grant","markdown-it","environment","nodejs-cloudant","assemble","express","session", "jhipster-uml", "neo-async"]
// let projects_list = ["cla-assistant", "grant", "markdown-it", "session"]
let result = {}
projects_list.forEach(filename => {
    result[filename] = getFPAveragePrecision(filename)
    console.log(getFPAveragePrecision(filename))
})
console.log(result)
// console.log(addEvaluationResult(process.argv[2]))

function getFPAveragePrecision(filename) {
    const RESULT_PATH = `${resultDirPath}${filename}${path.sep}results.json`
    let result = JSON.parse(fs.readFileSync(RESULT_PATH));
    let sumOfAveragePrecisions = 0;

    for (let commit in result) {
        let berke = result[commit]['berke']
        let berkeFP = berke.filter(item => item['FP-evaluation'] != undefined)
        berkeFP.sort(rankFPresult())

        let truePositiveCounter = 0;
        let sumOfPrecisions = 0;

        berkeFP.forEach((consequentInfo, index) => {

            truePositiveCounter = increaseIfIsTruePositive(truePositiveCounter, consequentInfo['FP-evaluation'])

            let precisionSoFar = truePositiveCounter / (index + 1)
            sumOfPrecisions += precisionSoFar
        })

        let impactSetSize = berkeFP.length;
        let averagePrecision = impactSetSize ? sumOfPrecisions / impactSetSize : 0;
        sumOfAveragePrecisions += averagePrecision;
    }

    let length = Object.keys(result).length

    return (sumOfAveragePrecisions / length).toFixed(2)
}


function increaseIfIsTruePositive(totalTruePositives, evaluationResult) {
    if (evaluationResult.toLowerCase().includes('true')) {
        totalTruePositives += 1
    }
    return totalTruePositives
}

function rankFPresult() {
    return function (a, b) {
        // only confidence
        // return b['confidence'] - a['confidence'];

        // only support then confidence
        if (b['support'] == a['support']) {
            return b['confidence'] - a['confidence'];
        } else {
            return b['support'] - a['support'];
        }

        // only confidence then support

        // if (b['confidence'] == a['confidence']) {
        //     return b['support'] - a['support'];
        // } else {
        //     return b['confidence'] - a['confidence'];
        // }
    };
}