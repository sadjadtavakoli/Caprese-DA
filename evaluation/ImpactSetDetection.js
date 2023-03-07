const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { exec } = require('child_process');
const { evaluationAnalyzer } = require('../berke');
const { getChangeSetPath, STATUS, TARMAQ_RESULT_PATH, TARMAQ_COMMAND, getOriginalImpactSetPath } = require('./evaluationConstants')

const DETECTED_IMPACT_SETS_PATH = getOriginalImpactSetPath()

if (process.argv[1].endsWith(path.basename(__filename))) {

    readChangeSets()
        .then((candidatedCommits) => {
            let testSet = [...candidatedCommits.keys()]
            testSet = testSet.reduce(
                (p, x) => p.then(() => {
                    let commitX = candidatedCommits.get(x)
                    return evaluationAnalyzer(x)
                        .then(() => runTARMAQ(x))
                        .then(() => collectResult(commitX))

                }),
                Promise.resolve())
            return testSet
        })
        .catch(error => {
            console.log(error)
        })
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

        let impactSetEmpty = new Map()
        for (let commit in commitsInfo) {
            let emptyBody = new Map()
            emptyBody.set("caprese", [])
            emptyBody.set("tarmaq", [])
            impactSetEmpty.set(commit, emptyBody)
        }

        let reversedList = new Map()
        for (let commit in commitsInfo) {
            reversedList.set(commitsInfo[commit]['changes'], commit)
        }

        detailedSequences = detailedSequences.map(item => item.split(" : ")[1])
        fs.writeFileSync(constants.SEQUENCES_PATH, detailedSequences.join("\n"));
        fs.writeFileSync(DETECTED_IMPACT_SETS_PATH, JSON.stringify(Object.fromEntries(impactSetEmpty)));

        resolve(reversedList)
    })
}

function collectResult(commit) {
    console.log(" = = = Collect Result = = = ")
    return new Promise(function (resolve, reject) {

        let impactSet = JSON.parse(fs.readFileSync(DETECTED_IMPACT_SETS_PATH));

        impactSet[commit]["caprese"] = getBerkeResult()
        impactSet[commit]["tarmaq"] = getTarmaqResult()

        fs.writeFileSync(DETECTED_IMPACT_SETS_PATH, JSON.stringify(impactSet));
        resolve();
    })

    function getTarmaqResult() {
        let tarmaqResult = JSON.parse(fs.readFileSync(TARMAQ_RESULT_PATH));
        let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(" ");
        tarmaqResult = tarmaqResult.map(item => {
            let consequent = item['rule'].split(" => ")[1];
            item['consequent'] = consequent;
            item['FP-antecedents'] = [item['rule'].split(" => ")[0].slice(1, -1).split(", ")]
            item['status'] = STATUS.tarmaq_unique;

            if (removed.includes(consequent)) {
                item['status'] = STATUS.removed;
            }
            return item;
        });
        return tarmaqResult;
    }

    function getBerkeResult() {
        return JSON.parse(fs.readFileSync(constants.Berke_RESULT_PATH));
    }
}


function runTARMAQ(changeSet) {
    console.log(" = = = Run TARMAQ = = = ")
    return new Promise(function (resolve, reject) {
        exec(`${TARMAQ_COMMAND}"${constants.SEQUENCES_PATH} ${TARMAQ_RESULT_PATH} ${changeSet}"`, (err, stdout, stderr) => {
            if (!err) {
                resolve()
            }
            else {
                reject(err)
            }
        })
    })
}

module.exports = { runTARMAQ }
