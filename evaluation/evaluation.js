const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { exec } = require('child_process');
const { evaluationGetMainData, evaluationAnalyzer } = require('../berke');
const { anonymouseName } = require('../computeBerkeResult');

const NUMBER_OF_COMMITS_PER_PROJECT = 10;
const RESULT_DIR_PATH = `${__dirname}${path.sep}result${path.sep}${constants.PROJECT_NAME}`;

const TARMAQ_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "TARMAQ";
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";

const RESULT_PATH = `${RESULT_DIR_PATH}${path.sep}results.json`
const TARMAQ_RESULT_PATH = `${RESULT_DIR_PATH}${path.sep}tarmaq.json`

const STATUS = {
    berke_unique: "Berke Unique",
    tarmaq_unique: "TARMAQ Unique",
    common: "common",
    removed: "Removed"
}

//  NEW NAME FOR BERKE: Caprese: an italian food 

if (process.argv[1].endsWith(path.basename(__filename))) {

    if (!fs.existsSync(RESULT_DIR_PATH)) {
        fs.mkdirSync(RESULT_DIR_PATH, {
            recursive: true
        });
    }

    evaluationGetMainData(constants.SEED_COMMIT)
        .then(testSetGenerator)
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

function testSetGenerator() {
    return new Promise(resolve => {
        console.log(" * * * testset Generator * * * ")
        let detailedSequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");
        let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(" ");
        let candidatedCommits = new Map()
        let maxIndex = detailedSequences.length - 1
        let useLessFiles = [
            "history.md", "HISTORY.md", "History.md", "CHANGELOG.md",
            "README.md", "readme.md", "Readme.md",
            "package.json", "package-lock.json",
            "appveyor.yml", ".travis.yml"]

        while (candidatedCommits.size < NUMBER_OF_COMMITS_PER_PROJECT) {
            let i = getRandomNumbers(maxIndex)
            maxIndex -= 1
            console.log(`random i = ${i}`)
            let sequence = detailedSequences[i]
            let commit = sequence.split(" : ")[0]
            let commitChanges = sequence.split(" : ")[1].slice(0, -4).split(" ").filter(item => !removed.includes(item) & !useLessFiles.includes(item))
            if (commitChanges.length <= 1 || includes(candidatedCommits, commitChanges)) {
                continue
            }
            candidatedCommits.set(commitChanges, commit)
            detailedSequences.splice(i, 1)
        }

        let reverseMap = new Map()
        for (let entity of candidatedCommits) {
            reverseMap.set(entity[1], { "commits": entity[0] })
        }

        detailedSequences = detailedSequences.map(item => item.split(" : ")[1])

        fs.writeFileSync(RESULT_PATH, JSON.stringify(Object.fromEntries(reverseMap)))
        fs.writeFileSync(constants.SEQUENCES_PATH, detailedSequences.join("\n"));
        resolve(candidatedCommits)
    })
}

function collectResult(commit) {
    console.log(" = = = Collect Result = = = ")
    return new Promise(function (resolve, reject) {

        let commitsInfo = JSON.parse(fs.readFileSync(RESULT_PATH));

        let tarmaqResult = getTarmaqResult();
        let berkeResult = getBerkeResult();

        tarmaqAndBerkeConsequentStatusUpdate(berkeResult, tarmaqResult);

        commitsInfo[commit]['berke'] = berkeResult
        commitsInfo[commit]['tarmaq'] = tarmaqResult

        commitsInfo[commit]['reversed-FP'] = reverseFP(commitsInfo[commit]['berke']);
        commitsInfo[commit]['reversed-DA'] = reverseDA(commitsInfo[commit]['berke']);

        fs.writeFileSync(RESULT_PATH, JSON.stringify(commitsInfo));
        resolve();
    })
}

function getTarmaqResult() {
    let tarmaqResult = JSON.parse(fs.readFileSync(TARMAQ_RESULT_PATH));
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(" ");
    tarmaqResult = tarmaqResult.map(item => {
        let consequent = item['rule'].split(" => ")[1];
        item['consequent'] = consequent;
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
function tarmaqAndBerkeConsequentStatusUpdate(berkeResult, tarmaqResult) {

    berkeResult.forEach(item => {
        let consequent = item["consequent"].split(" | ")[0]
        let tarmaqItems = tarmaqResult.filter(element => element['consequent'] == consequent || element['consequent'] == anonymouseName(consequent))
        if (tarmaqItems.length != 0) {
            tarmaqItems.forEach(tarmaqItem => tarmaqItem['status'] = STATUS.common)
            item["status"] = STATUS.common;
        } else {
            item["status"] = STATUS.berke_unique;
        }
    });
}

function reverseFP(impactSet) {
    let result = {};
    impactSet.forEach(impacted => {
        let consequent = impacted['consequent']
        let antecedents = impacted['FP-antecedents']
        if (antecedents != undefined) {
            antecedents.forEach(element => {
                let id = stringfy(element)
                if (result[id] == undefined) {
                    result[id] = []
                }
                result[id].push({ 'consequent': consequent, 'support': impacted['support'], 'FP-score': impacted['FP-score'], 'status': impacted['status'], 'DA': impacted['DA-antecedents'], 'evaluation result': '' })

            });
        }
    })
    return result
}

function reverseDA(impactSet) {
    let result = {};
    impactSet.forEach(impacted => {
        let consequent = impacted['consequent']
        let antecedents = impacted['DA-antecedents']
        if (antecedents != undefined) {
            antecedents.forEach(id => {
                if (result[id] == undefined) {
                    result[id] = []
                }
                result[id].push({ 'consequent': consequent, 'support': impacted['support'], 'FP-score': impacted['FP-score'], 'status': impacted['status'], 'FP': impacted['FP-antecedents'], 'evaluation result': '' })

            });
        }
    })
    return result
}

function getRandomNumbers(maximum) {
    return Math.floor(Math.random() * maximum)
}

function areEquals(array1, array2) {
    if (array1.length != array2.length) return false
    return array2.filter(item => !array1.includes(item)).length == 0
}

function includes(mapArr, array) {
    for (let item of mapArr) {
        if (areEquals(item[0], array)) {
            return true
        }
    }
    return false
}

function stringfy(listOfFunctions) {
    return listOfFunctions.join(",")
}

function runTARMAQ(changeSet) {
    console.log(" = = = Run TARMAQ = = = ")
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(TARMAQ_RESULT_PATH)) {
            fs.unlinkSync(TARMAQ_RESULT_PATH)
        }
        fs.writeFileSync(TARMAQ_RESULT_PATH, "")
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

module.exports = { STATUS }