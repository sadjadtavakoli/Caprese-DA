const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { getSPADEPatternsForExectionTime } = require('./ImpactSetDetection')
const { performance } = require('perf_hooks');

const { getChangeSetPath, EXECUTION_TIMES_PATH } = require('./evaluationConstants')


runAll()

async function runAll() {
    await run("express")
    await run("bignumber.js")
    await run("session")
    await run("jhipster-uml")
    await run("grant")
    await run("environment")
    await run("cla-assistant")
    await run("assemble")
    await run("nock")
    await run("fastify")
}

async function run(benchmark) {
    return new Promise(resolve => {
        let SPADE_ExecutionTime = [];

        readChangeSets(benchmark)
            .then(() => getEvaluationTime(getSPADEPatternsForExectionTime, 1, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 2, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 3, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 4, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 5, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 6, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 7, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 8, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 9, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 10, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 11, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 12, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 13, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 14, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 15, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 16, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 17, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 18, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 19, SPADE_ExecutionTime, benchmark))
            .catch(() => getEvaluationTime(getSPADEPatternsForExectionTime, 20, SPADE_ExecutionTime, benchmark))
            .then(resolve)

        function readChangeSets(benchmark) {
            return new Promise(resolve => {
                let commitsInfo = JSON.parse(fs.readFileSync(getChangeSetPath(benchmark)));
                let sequencePath = path.dirname(__dirname) + path.sep + 'data' + path.sep + "ProjectsData" + path.sep + benchmark + path.sep + "sequences.txt"
                let detailedSequences = fs.readFileSync(sequencePath + "details.txt").toString().trim().split("\n");

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
                fs.writeFileSync(sequencePath, detailedSequences.join("\n"));
                resolve(reversedList)
            })
        }

        function getEvaluationTime(callback, query, evalutiontimes, extraInput) {
            var startTime = performance.now()
            return callback(query, extraInput).then(() => {
                var endTime = performance.now()
                let executiontime = endTime - startTime
                console.log(executiontime)
                evalutiontimes.push(executiontime)
                writeExecutionTimes(query)
            })
        }


        let writeExecutionTimes = (support) => {
            console.log("write!", support)
            let executionTimes = JSON.parse(fs.readFileSync(EXECUTION_TIMES_PATH))
            const average = (arr) => { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : "-" };

            executionTimes[benchmark]["SPADE"] = {
                "support": support, "time": average(SPADE_ExecutionTime)
            }

            fs.writeFileSync(EXECUTION_TIMES_PATH, JSON.stringify(executionTimes))
        }


    })
}    
