const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { exec } = require('child_process');
const { evaluationGetMainData, evaluationAnalyzer } = require('../berke');
const { range } = require('lodash');

const NUMBER_OF_COMMITS_PER_PROJECT = 100;
const CLEANUP_COMMAND = "node cleanup.js";
const RESULT_PATH = `${__dirname}${path.sep}result${path.sep}${constants.PROJECT_NAME}${path.sep}contribution${path.sep}`;
const COMMIT_DATA_PATH = `${RESULT_PATH}commits.json`

let testSetChanges = []
let candidatedCommits = {}

if (!fs.existsSync(RESULT_PATH)) {
    fs.mkdirSync(RESULT_PATH, {
        recursive: true
    });
}

function testSetGenerator() {
    return new Promise(resolve => {
        let detailedSequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");
        let sequences = fs.readFileSync(constants.SEQUENCES_PATH).toString().trim().split("\n");
        let testSet = []

        for (let i in range(0, detailedSequences.length)) {
            let sequence = detailedSequences[i]
            let commit = sequence.split(" : ")[0]
            let commitChanges = sequence.split(" : ")[1].slice(0, -4).split(" ")
            if (candidatedCommits[commitChanges]) {
                continue
            }
            if (testSet.length == NUMBER_OF_COMMITS_PER_PROJECT) {
                break
            }
            candidatedCommits[commitChanges] = commit
            testSetChanges.push(commitChanges) // commit and its changes 
            sequences.splice(i, 1)
        }
        fs.writeFileSync(COMMIT_DATA_PATH, JSON.stringify(candidatedCommits))
        fs.writeFileSync(constants.SEQUENCES_PATH, sequences.join("\n"));
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

exec(CLEANUP_COMMAND, (err, stdout, stderr) => {
    if (!err) {
        evaluationGetMainData(constants.SEED_COMMIT).then(testSetGenerator).then(() => {
            testSetChanges = testSetChanges.reduce( // MUST RUN IN SEQUENCE NOT PARAl
                (p, x) => p.then(() => {
                    return evaluationAnalyzer(x).then(()=>getUniqueContributions(candidatedCommits[x]))
                }),
                Promise.resolve())
            return testSetChanges
        }).catch(error => {
            console.log(error)
        })
    } else {
        console.log(err)
    }
})