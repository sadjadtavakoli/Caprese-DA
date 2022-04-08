const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const exec = require('child_process').exec;
const runBerke = require('../berke').runBerke

const NUMBER_OF_COMMITS_PER_PROJECT = 20;
const NUMBER_OF_COMMITS_TO_EXPLORE = 10;
const CLEANUP_COMMAND = "node cleanup.js";
const SEED_COMMIT = "947b6b7d57939d1a3b33ce008765f9aba3eb6f70"
const REPO_URL = "git@github.com:expressjs/express.git"
const PROJECT_NAME = [...REPO_URL.matchAll("[\\w\\.-]+(?=.git)")].pop();
const RESULT_PATH = `result${path.sep}${PROJECT_NAME}${path.sep}`;
const COMMIT_DATA_PATH = `${RESULT_PATH}commits.json`


if (!fs.existsSync(RESULT_PATH)) {
    fs.mkdirSync(RESULT_PATH, {
        recursive: true
    });
}

function run(repoUrl, seeCommit) {
    getlastNCommits(repoUrl, seeCommit, NUMBER_OF_COMMITS_TO_EXPLORE).then(testSetGenerator).then((testSet) => {
        testSet.reduce( // MUST RUN IN SEQUENCE NOT PARAl
            (p, x) => p.then(() => runAnalyzer(x)),
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
            testSet.push(commit)
        }
        fs.writeFileSync(COMMIT_DATA_PATH, JSON.stringify(candidatedCommits))
        resolve(testSet)
    })
}

function runAnalyzer(test) {
    return new Promise(resolve => {
        console.log(`# # # # # # . . . . ${test} # # # #`)
        exec(CLEANUP_COMMAND, (err, stdout, stderr) => {
            if (!err) {

                runBerke(test).then(() => {
                    resolve()
                    getUniqueContributions(test)
                })
            } else {
                console.log(err)
            }
        })
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