const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { exec } = require('child_process');
const { evaluationGetMainData, evaluationAnalyzer } = require('../berke');
const { range } = require('lodash');

const NUMBER_OF_COMMITS_PER_PROJECT = 10;
const CLEANUP_COMMAND = "node cleanup.js";
// const CLEANUP_COMMAND = "node -v";
const RESULT_DIR_PATH = `${__dirname}${path.sep}result${path.sep}${constants.PROJECT_NAME}${path.sep}contribution`;

const TARMAQ_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "TARMAQ";
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";

const COMMIT_DATA_PATH = `${RESULT_DIR_PATH}${path.sep}commits.json`
const RESULT_JSON_PATH = `${RESULT_DIR_PATH}${path.sep}results.json`
const TARMAQ_RESULT_PATH = `${RESULT_DIR_PATH}${path.sep}tarmaq.json`


if (!fs.existsSync(RESULT_DIR_PATH)) {
    fs.mkdirSync(RESULT_DIR_PATH, {
        recursive: true
    });
}

if (fs.existsSync(RESULT_JSON_PATH)) {
    fs.unlinkSync(RESULT_JSON_PATH)
}
fs.writeFileSync(RESULT_JSON_PATH, "{}")

exec(CLEANUP_COMMAND, (err, stdout, stderr) => {
    if (!err) {
        evaluationGetMainData(constants.SEED_COMMIT).then(testSetGenerator)
            .then((candidatedCommits) => {
                let testSet = [...candidatedCommits.keys()]
                testSet = testSet.reduce(
                    (p, x) => p.then(() => {
                        return evaluationAnalyzer(x).then(() => runTARMAQ(x)).then(() => getUniqueContributions(candidatedCommits.get(x)))
                    }),
                    Promise.resolve())
                return testSet
            })
            .catch(error => {
                console.log(error)
            })
    } else {
        console.log(err)
    }
})

function testSetGenerator() {
    return new Promise(resolve => {
        console.log(" * * * testset Generator * * * ")
        let detailedSequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");
        let sequences = fs.readFileSync(constants.SEQUENCES_PATH).toString().trim().split("\n");
        let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");
        let candidatedCommits = new Map()
        let randomsSoFar = []
        let maxIndex = detailedSequences.length
        let useLessFiles = [
            "history.md", "HISTORY.md", "History.md",
            "README.md", "readme.md", "Readme.md",
            "package.json", "package-lock.json",
            "appveyor.yml", ".travis.yml"]

        while (true) {
            let i = getRandomNumbers(maxIndex)
            while (randomsSoFar.length > 0 && randomsSoFar.includes(i)) {
                i = getRandomNumbers(maxIndex)
            }
            randomsSoFar.push(i)

            let sequence = detailedSequences[i]
            let commit = sequence.split(" : ")[0]
            let commitChanges = sequence.split(" : ")[1].slice(0, -4).split(" ").filter(item => !removed.includes(item) & !useLessFiles.includes(item))
            if (commitChanges.length <= 1 || includes(candidatedCommits, commitChanges)) {
                continue
            }
            if (candidatedCommits.size >= NUMBER_OF_COMMITS_PER_PROJECT) {
                break
            }
            candidatedCommits.set(commitChanges, commit)
            sequences.splice(i, 1)
        }
        let reverseMap = new Map()
        for (let entity of candidatedCommits) {
            reverseMap.set(entity[1], { "commits": entity[0] })
        }

        fs.writeFileSync(COMMIT_DATA_PATH, JSON.stringify(Object.fromEntries(reverseMap)))
        fs.writeFileSync(constants.SEQUENCES_PATH, sequences.join("\n"));
        resolve(candidatedCommits)
    })
}

function getRandomNumbers(maximum) {
    return Math.floor(Math.random() * maximum)
}
function getUniqueContributions(commit) {
    console.log(" = = = Collect Result = = = ")

    // collect and evaluate Berke's result
    let impactSet = JSON.parse(fs.readFileSync(constants.Berke_RESULT_PATH));
    let contributionResult = JSON.parse(fs.readFileSync(RESULT_JSON_PATH));
    let uniqeContributions = { 'DA': [], 'FP': [], 'Common': [] }
    for (let item of impactSet) {
        if (Object.keys(item[1]).length == 1) {
            uniqeContributions[Object.keys(item[1])[0]].push(item[0])
        } else {
            uniqeContributions['Common'].push(item[0])
        }
    }
    contributionResult[commit] = uniqeContributions
    fs.writeFileSync(RESULT_JSON_PATH, JSON.stringify(contributionResult))



    // collect and evaluate TARMAQ's resutl
    let tarmaqResult = JSON.parse(fs.readFileSync(TARMAQ_RESULT_PATH));
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");
    tarmaqResult = tarmaqResult.map(item => {
        let consequent = item['rule'].split(" => ")[1]
        if(removed.includes(consequent)){
            item['status'] = "removed"
        }
        if(uniqeContributions['FP'].includes(consequent)){
            item['status'] = "common with Berke"
        }
        return item
    });

    let commitsInfo = JSON.parse(fs.readFileSync(COMMIT_DATA_PATH));
    commitsInfo[commit]['berke'] = impactSet
    commitsInfo[commit]['tarmaq'] = tarmaqResult
    fs.writeFileSync(COMMIT_DATA_PATH, JSON.stringify(commitsInfo))

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

function runTARMAQ(changeSet) {
    console.log(" = = = Run TARMAQ = = = ")
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