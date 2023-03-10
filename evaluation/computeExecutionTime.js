const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { evaluationAnalyzer, tempFP, runDynamicAnalysis } = require('../caprese');
const { runTARMAQ } = require('./ImpactSetDetection')
const { performance } = require('perf_hooks');

const { getChangeSetPath, EXECUTION_TIMES_PATH } = require('./evaluationConstants')

if (process.argv[1].endsWith(path.basename(__filename))) {

    let tarmaqExecutionTime = [];
    let capreseExectionTime = [];
    let FPExectionTime = [];
    let DAExectionTime = [];
    let executionTimes = JSON.parse(fs.readFileSync(EXECUTION_TIMES_PATH))
    getEvaluationTime(runDynamicAnalysis, undefined, DAExectionTime)
        .then(() => readChangeSets()
            .then((candidatedCommits) => {
                let testSet = [...candidatedCommits.keys()]
                testSet = testSet.reduce(
                    (p, x) => p.then(() => {
                        candidatedCommits.get(x)
                        return getEvaluationTime(evaluationAnalyzer, x, capreseExectionTime)
                            .then(() => getEvaluationTime(tempFP, x, FPExectionTime))
                            .then(() => getEvaluationTime(runTARMAQ, x, tarmaqExecutionTime))

                    }),
                    Promise.resolve())
                return testSet
            }).then(() => {
                const average = (arr) => { return arr.reduce((a, b) => a + b, 0) / arr.length };
                let executionTime = {
                    "tarmaq": {
                        "all": tarmaqExecutionTime, "average": average(tarmaqExecutionTime),
                    },
                    "caprese": {
                        "all": capreseExectionTime, "average": average(capreseExectionTime),
                    },
                    "FP": {
                        "all": FPExectionTime, "average": average(FPExectionTime),
                    },
                    "DA": {
                        "all": average(DAExectionTime)
                    }
                }
                executionTimes[constants.PROJECT_NAME] = executionTime
                console.log(executionTime)
                fs.writeFileSync(EXECUTION_TIMES_PATH, JSON.stringify(executionTimes))

            })
            .catch(error => {
                console.log(error)
            }))
}

function readChangeSets() {
    return new Promise(resolve => {
        let commitsInfo = JSON.parse(fs.readFileSync(getChangeSetPath()));

        let detailedSequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");

        for (let i = 0; i < detailedSequences.length; i += 1) {

            let sequence = detailedSequences[i]
            let commit = sequence.split(" : ")[0]
            if (commitsInfo[commit] != undefined) {
                console.log(commit)
                detailedSequences.splice(i, 1)
                i -= 1
            }
        }

        let reversedList = new Map()
        for (let commit in commitsInfo) {
            reversedList.set(commitsInfo[commit]['changes'], commit)
        }
        detailedSequences = detailedSequences.map(item => item.split(" : ")[1])
        fs.writeFileSync(constants.SEQUENCES_PATH, detailedSequences.join("\n"));

        resolve(reversedList)
    })
}

function getEvaluationTime(callback, query, evalutiontimes) {
    var startTime = performance.now()
    return callback(query).then(() => {
        var endTime = performance.now()
        let executiontime = endTime - startTime
        evalutiontimes.push(executiontime)
    })
}

module.exports = { EXECUTION_TIMES_PATH }