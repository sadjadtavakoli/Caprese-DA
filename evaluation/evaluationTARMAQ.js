const fs = require('fs');
const path = require('path');
const constants = require('../constants.js');
const { runClasp } = require('../berke.js');
const { intrepretFPData, sortAndReport } = require('../computeBerkeResult')
const { exec } = require('child_process');
const { range } = require('lodash');
const { runBerke } = require('../berke')

const NUMBER_OF_COMMITS_PER_PROJECT = 100;
const NUMBER_OF_COMMITS_TO_EXPLORE = 500;
const CLEANUP_COMMAND = "node cleanup.js";
const SEED_COMMIT = "947b6b7d57939d1a3b33ce008765f9aba3eb6f70"
const REPO_URL = "git@github.com:expressjs/express.git"
const PROJECT_NAME = [...REPO_URL.matchAll("[\\w\\.-]+(?=.git)")].pop();
const RESULT_PATH = `${path.dirname(__dirname)}${path.sep}result${path.sep}${PROJECT_NAME}${path.sep}`;
const TARMAQ_RESULT_PATH = `${RESULT_PATH}tarmaq.json`; // tarmq result
const TARMAQ_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "TARMAQ";
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";


function run(repoUrl, seeCommit) {
    getlastNCommits(repoUrl, seeCommit, NUMBER_OF_COMMITS_TO_EXPLORE).then(testSetGenerator).then((testSet) => {
        testSet.reduce( // MUST RUN IN SEQUENCE NOT PARAl
            (p, x) => p.then(() => runCommitQueries(x)),
            Promise.resolve())
    }).catch(error => {
        console.log(error)
    })
}

function testSetGenerator() {
    return new Promise(resolve => {
        let sequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");
        let candidatedCommits = {}
        let testSet = []
        for (let sequence of sequences) {
            let commit = sequence.split(" : ")[0]
            let commitChanges = sequence.split(" : ")[1]
            if (candidatedCommits[commitChanges]) {
                continue
            }
            if (testSet.length == NUMBER_OF_COMMITS_PER_PROJECT) {
                break
            }
            candidatedCommits[commitChanges] = commit
            testSet.push([commit, changeSetGenerator(commitChanges)])
        }
        resolve(testSet)
    })
}

function changeSetGenerator(changedFunctionString) {
    let changes = changedFunctionString.slice(0, -4).split(" ")
    let changeSets = []
    for (let i of range(1, changes.length)) {
        changeSets.push(randomSelection(changes, i))
    }
    return changeSets
}

function randomSelection(functions, count) {
    let shuffled = functions.sort(() => 0.5 - Math.random());
    return [shuffled.slice(0, count), shuffled.slice(count)]
}

function runCommitQueries(commitQueries) {
    let commit = commitQueries[0]
    let queries = commitQueries[1]
    console.log(`# # # # ${commit} # # # #`)
    let firstItem = queries.shift()

    let firstPromis = new Promise(resolve => {
        exec(CLEANUP_COMMAND, (err, stdout, stderr) => {
            if (!err) {
                runAnalyzer(firstItem, commit, runBerke).then(() => resolve())
            } else {
                console.log(err)
            }
        })
    })
    queries = queries.reduce( // MUST RUN IN SEQUENCE NOT PARAl
        (p, x) => p.then(() => runAnalyzer(x, commit, frequentPatternResult)),
        firstPromis)
    return queries
}

function runAnalyzer(query, commit, analyzer) {
    return new Promise(resolve => {
        console.log(" - - - " + commit)
        console.log(query)
        let result = {}
        let changeSet = query[0];
        let impactSet = query[1]
        analyzer(commit, changeSet).then(() => runTARMAQ(changeSet)).then(() => {
            resolve();
            result = { 'changeSet': changeSet, 'impactSet': impactSet, 'evaluationResult': compareResults(impactSet) }
            fs.writeFileSync(`${RESULT_PATH}${commit}_${changeSet.length}.json`, JSON.stringify(result))
        });
    });
}

function frequentPatternResult(_, changeSet) {
    return runClasp().then(() => {
        return new Promise(resolve => {
            let impactSet = new Map()
            intrepretFPData(changeSet, impactSet)
            sortAndReport(impactSet)
            resolve()
        })
    })
}


function runTARMAQ(changeSet) {
    console.log(" # # # # Run TARMAQ # # # # ")
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(TARMAQ_RESULT_PATH)) {
            fs.unlinkSync(TARMAQ_RESULT_PATH)
        }
        fs.writeFileSync(TARMAQ_RESULT_PATH, "")
        exec(TARMAQ_COMMAND + `"${constants.SEQUENCES_PATH} ${TARMAQ_RESULT_PATH} ${changeSet}"`, (err, stdout, stderr) => {
            if (!err) {
                resolve()
            }
            else {
                reject(err)
            }
        })
    })
}

function compareResults(impactSet) {
    console.log(" # # # # Compare Result # # # # ")
    // compute precision and recall here 
    let tarmaq = JSON.parse(fs.readFileSync(TARMAQ_RESULT_PATH))
    let berkeResult = JSON.parse(fs.readFileSync(constants.Berke_RESULT_PATH))

    let tarmaqAntecedents = []
    let berkeAntecedents = []
    for (let rule of tarmaq) {
        tarmaqAntecedents.push(rule['rule'].split(" => ")[1])
    }
    for (let rule of berkeResult) {
        berkeAntecedents.push(rule[0])
    }

    return {
        'top5': topNPrecisionAndRecall(impactSet, tarmaqAntecedents, berkeAntecedents, 5),
        'top10': topNPrecisionAndRecall(impactSet, tarmaqAntecedents, berkeAntecedents, 10),
        'top20': topNPrecisionAndRecall(impactSet, tarmaqAntecedents, berkeAntecedents, 20),
        'top30': topNPrecisionAndRecall(impactSet, tarmaqAntecedents, berkeAntecedents, 30)
    }
}

function topNPrecisionAndRecall(expected, tarmaqExtracted, berkeExtracted, N) {
    let tarmaqPandR = precisionAndRecall(expected, tarmaqExtracted, N)
    let berkePandR = precisionAndRecall(expected, berkeExtracted, N)
    return { 'TARMAQ': tarmaqPandR, 'FP': berkePandR }
}

function precisionAndRecall(expected, extracted, N) {
    let topN = extracted.slice(0, N)
    let discovered = expected.filter(x => topN.indexOf(x) !== -1)
    // console.log(`TopN = ${topN}`)
    // console.log(`expected = ${expected}`)
    // console.log(`discovered = ${discovered}`)
    return { "precision": discovered.length / N, "recall": discovered.length / expected.length }
}

function getlastNCommits(repoUrl, seedCommit, diggingDepth) {
    console.log("* * * RefDiff for test-set * * *  ")
    return new Promise(function (resolve, reject) {
        exec(`${constants.REFDIFF_COMMAND}"${repoUrl} ${seedCommit} ${constants.SEQUENCES_PATH} ${constants.REMOVED_PATH} ${diggingDepth} ${constants.MAPPINGS_PATH}"`, (err, stdout, stderr) => {
            if (!err) {
                resolve()
            }
            else {
                reject()
            }
        })
    })
}

exec(CLEANUP_COMMAND, (err, stdout, stderr) => {
    if (!err) {
        run(REPO_URL, SEED_COMMIT)
    } else {
        console.log(err)
    }
})