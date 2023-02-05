const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require('./evaluation')
const { benchmarkList } = require('./projects_confiqs')


benchmarkList.forEach(filename => {
    addEvaluationResult(filename)
})

function addEvaluationResult(filename) {
    const RESULT_PATH = `${resultDirPath}${filename}${path.sep}results.json`
    let result = JSON.parse(fs.readFileSync(RESULT_PATH));

    for (let commit in result) {
        let reversedFP = result[commit]['reversed-FP']
        let berke = result[commit]['berke']

        for (let consequentInfo of berke) {
            if (consequentInfo['DA-antecedents'] != undefined) {
                consequentInfo['DA-antecedents'] = removeDuplicates(consequentInfo['DA-antecedents'])
            }
        }

        for (let antecedent in reversedFP) {
            for (let consequentInfo of reversedFP[antecedent]) {
                if (consequentInfo['DA'] != undefined) {
                    consequentInfo['DA'] = removeDuplicates(consequentInfo['DA'])
                }
            }
        }
    }
    fs.writeFileSync(RESULT_PATH, JSON.stringify(result));
}

function removeDuplicates(arr) {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
}