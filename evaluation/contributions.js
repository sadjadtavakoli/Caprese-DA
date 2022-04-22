const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const exec = require('child_process').exec;
const { evaluationGetMainData, evaluationAnalyzer } = require('../berke');
const { range } = require('lodash');

const NUMBER_OF_COMMITS_PER_PROJECT = 100;
const NUMBER_OF_COMMITS_TO_EXPLORE = 300;
const CLEANUP_COMMAND = "node cleanup.js";
const SEED_COMMIT = constants.SEED_COMMIT
const REPO_URL = constants.REPO_URL
const PROJECT_NAME = constants.PROJECT_NAME;
const RESULT_PATH = `${__dirname}${path.sep}result${path.sep}${PROJECT_NAME}${path.sep}contribution${path.sep}`;
const COMMIT_DATA_PATH = `${RESULT_PATH}commits.json`

let testSetCommits = []
let testSetChanges = []
let candidatedCommits = {}

if (!fs.existsSync(RESULT_PATH)) {
    fs.mkdirSync(RESULT_PATH, {
        recursive: true
    });
}

function run(repoUrl, seedCommit) {
    getlastNCommits(repoUrl, seedCommit, NUMBER_OF_COMMITS_TO_EXPLORE).then(testSetGenerator).then(() => {
        let firstPromis = new Promise((resolve) => {
            exec(CLEANUP_COMMAND, (err, stdout, stderr) => {
                if (!err) {
                    evaluationGetMainData(seedCommit).then(() => excludeTestCases()).then(() => resolve())
                } else {
                    console.log(err)
                }
            })
        })

        testSetChanges = testSetChanges.reduce( // MUST RUN IN SEQUENCE NOT PARAl
            (p, x) => p.then(() => {
                return evaluationAnalyzer(seedCommit, x).then(()=>getUniqueContributions(candidatedCommits[x]))
            }),
            firstPromis)
        return testSetChanges
    }).catch(error => {
        console.log(error)
    })
}

function testSetGenerator() {
    return new Promise(resolve => {
        let sequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");
        let testSet = []
        for (let sequence of sequences.reverse()) {
            let commit = sequence.split(" : ")[0]
            let commitChanges = sequence.split(" : ")[1].slice(0, -4).split(" ")
            if (candidatedCommits[commitChanges]) {
                continue
            }
            if (testSet.length == NUMBER_OF_COMMITS_PER_PROJECT) {
                break
            }
            candidatedCommits[commitChanges] = commit
            testSetCommits.push(commit) // commit and its changes 
            testSetChanges.push(commitChanges) // commit and its changes 
        }
        fs.writeFileSync(COMMIT_DATA_PATH, JSON.stringify(candidatedCommits))
        resolve()
    })
}

function getUniqueContributions(commit) {
    console.log(" * * * Unique contribution * * * ")
    let impactSet = JSON.parse(fs.readFileSync(constants.Berke_RESULT_PATH).toString());
    let uniqeContributions = { 'DA': [], 'FP': [], 'Common': [] }
    for (let item of impactSet) {
        if (Object.keys(item[1]).length == 1) {
            uniqeContributions[Object.keys(item[1])[0]].push(item[0])
        } else {
            uniqeContributions['Common'].push(item[0])
        }
    }
    fs.writeFileSync(`${RESULT_PATH}${commit}.json`, JSON.stringify(uniqeContributions))
}

function getlastNCommits(repoUrl, seedCommit, diggingDepth, sequencesPath = constants.SEQUENCES_PATH) {
    console.log("* * * RefDiff for test-set * * * ") 
    return new Promise(function (resolve, reject) {
        exec(`${constants.REFDIFF_COMMAND}"${repoUrl} ${seedCommit} ${sequencesPath} ${constants.REMOVED_PATH} ${diggingDepth} ${constants.MAPPINGS_PATH}"`, (err, stdout, stderr) => {
            if (!err) {
                resolve(seedCommit)
            }
            else {
                reject()
            }
        })
    })
}

function excludeTestCases() {
    console.log("* * * excluding test * * * ") 
    return new Promise((resolve) => {
        let detailedSequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");
        let sequences = fs.readFileSync(constants.SEQUENCES_PATH).toString().trim().split("\n");
        for (let i in range(0, sequences.length)) {
            if (testSetCommits.includes(detailedSequences[i].split(" : "))[0]) {
                sequences.splice(i, 1)
            }
        }
        fs.writeFileSync(constants.SEQUENCES_PATH, sequences.join("\n"));
        resolve()
    })
}
exec(CLEANUP_COMMAND, (err, stdout, stderr) => {
    if (!err) {
        run(REPO_URL, SEED_COMMIT)
    } else {
        console.log(err)
    }
})