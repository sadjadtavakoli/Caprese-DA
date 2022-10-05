const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { evaluationAnalyzer } = require('../berke');
const { runTARMAQ } = require('./evaluation')
const { performance } = require('perf_hooks');

const RESULT_DIR_PATH = `${__dirname}${path.sep}result${path.sep}${constants.PROJECT_NAME}`;

const RESULT_PATH = `${RESULT_DIR_PATH}${path.sep}results.json`
const EXECUTION_TIMES_PATH = `${__dirname}${path.sep}result${path.sep}executionTime.json`

if (process.argv[1].endsWith(path.basename(__filename))) {

    if (!fs.existsSync(RESULT_DIR_PATH)) {
        fs.mkdirSync(RESULT_DIR_PATH, {
            recursive: true
        });
    }
    let tarmaqExecutionTime = [];
    let capreseExectionTime = [];
    let executionTimes = JSON.parse(fs.readFileSync(EXECUTION_TIMES_PATH))
    testSetGenerator()
        .then((candidatedCommits) => {
            let testSet = [...candidatedCommits.keys()]
            testSet = testSet.reduce(
                (p, x) => p.then(() => {
                    candidatedCommits.get(x)
                    return getEvaluationTime(evaluationAnalyzer, x, capreseExectionTime)
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
                "berke": {
                    "all": capreseExectionTime, "average": average(capreseExectionTime),
                }
            }
            executionTimes[constants.PROJECT_NAME] = executionTime
            console.log(executionTime)
            fs.writeFileSync(EXECUTION_TIMES_PATH, JSON.stringify(executionTimes))

        })
        .catch(error => {
            console.log(error)
        })
}

function testSetGenerator() {
    return new Promise(resolve => {
        let commitsInfo = JSON.parse(fs.readFileSync(RESULT_PATH));

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
            reversedList.set(commitsInfo[commit]['commits'], commit)
        }
        // reverse commits' info and pass the list of candidate changes and commits to resolve.
        // or simply pass it as a list of 2-length lists which the first item is the commit sha and the second one is its changes
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

module.exports = {EXECUTION_TIMES_PATH}