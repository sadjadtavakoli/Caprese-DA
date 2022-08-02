const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { exec } = require('child_process');
const { evaluationGetMainData, evaluationAnalyzer } = require('../berke');

const NUMBER_OF_COMMITS_PER_PROJECT = 10;
const RESULT_DIR_PATH = `${__dirname}${path.sep}result${path.sep}${constants.PROJECT_NAME}`;

const TARMAQ_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "TARMAQ";
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";

const RESULT_PATH = `${RESULT_DIR_PATH}${path.sep}results.json`
const UNITS_CONTRIBUTION_PATH = `${RESULT_DIR_PATH}${path.sep}units_contribution.json`
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

    if (fs.existsSync(UNITS_CONTRIBUTION_PATH)) {
        fs.unlinkSync(UNITS_CONTRIBUTION_PATH)
    }
    fs.writeFileSync(UNITS_CONTRIBUTION_PATH, "{}")

    evaluationGetMainData(constants.SEED_COMMIT)
        .then(testSetGenerator)
        .then((candidatedCommits) => {
            let testSet = [...candidatedCommits.keys()]
            testSet = testSet.reduce(
                (p, x) => p.then(() => {
                    return evaluationAnalyzer(x)
                        .then(() => runTARMAQ(x))
                        .then(() => collectResult(candidatedCommits.get(x)))
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
        let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");
        let candidatedCommits = new Map()
        let maxIndex = detailedSequences.length - 1
        let useLessFiles = [
            "history.md", "HISTORY.md", "History.md",
            "README.md", "readme.md", "Readme.md",
            "package.json", "package-lock.json",
            "appveyor.yml", ".travis.yml"]

        while (true) {
            let i = getRandomNumbers(maxIndex)
            maxIndex -= 1
            console.log(`random i = ${i}`)
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

        // separate berke's different units' results
        let uniqeContributions = separateDAnFPsResults(commit);

        // collect and evaluate TARMAQ's resutl
        let tarmaqResult = tarmaqConsequentStatusUpdate(uniqeContributions);
        commitsInfo[commit]['tarmaq'] = tarmaqResult

        // collect and evaluate Berke's result
        commitsInfo[commit]['berke'] = berkeConsequentStatusUpdate(tarmaqResult);

        commitsInfo[commit]['reversed-FP'] = reverseFP(commitsInfo[commit]['berke']);

        fs.writeFileSync(RESULT_PATH, JSON.stringify(commitsInfo));
        resolve();
    })
}

function tarmaqConsequentStatusUpdate(berkeSeparateUnitsResult) {
    let tarmaqResult = JSON.parse(fs.readFileSync(TARMAQ_RESULT_PATH));
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");
    tarmaqResult = tarmaqResult.map(item => {
        let consequent = item['rule'].split(" => ")[1];
        item['consequent'] = consequent;
        if (removed.includes(consequent)) {
            item['status'] = STATUS.removed;
        } else if (berkeSeparateUnitsResult['FP'].includes(consequent) || berkeSeparateUnitsResult['common'].includes(consequent)) {
            item['status'] = STATUS.common;
        } else {
            item['status'] = STATUS.tarmaq_unique;
        }
        return item;
    });
    return tarmaqResult;
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
                result[id].push({ 'consequent': consequent, 'support': impacted['support'], 'FP-score': impacted['FP-score'], 'status': impacted['status'], 'DA': impacted['DA-antecedents'] ? true : false })

            });
        }
    })
    return result
}

function berkeConsequentStatusUpdate(tarmaqResult) {
    let impactSet = JSON.parse(fs.readFileSync(constants.Berke_RESULT_PATH));
    let tarmaqKeys = tarmaqResult.map(item => {
        return item['consequent'];
    });

    impactSet = impactSet.map(item => {
        let consequent = item["consequent"].split(" | ")[0]
        if (tarmaqKeys.includes(consequent)) {
            item["status"] = STATUS.common;
        } else {
            item["status"] = STATUS.berke_unique;
        }
        return item;
    });
    return impactSet;
}

function separateDAnFPsResults(commit) {
    let impactSet = JSON.parse(fs.readFileSync(constants.Berke_RESULT_PATH));
    let commitsContributionData = JSON.parse(fs.readFileSync(UNITS_CONTRIBUTION_PATH));
    let uniqeContributions = { 'DA': [], 'FP': [], 'common': [] };

    for (let item of impactSet) {
        let consequent = item["consequent"].split(" | ")[0]
        if (item["FP-antecedents"] != undefined && item["DA-antecedents"] != undefined) {
            uniqeContributions['common'].push(consequent);
        } else if (item["DA-antecedents"] != undefined) {
            uniqeContributions["DA"].push(consequent);
        }
        else {
            uniqeContributions["FP"].push(consequent);
        }
    }
    commitsContributionData[commit] = uniqeContributions;
    fs.writeFileSync(UNITS_CONTRIBUTION_PATH, JSON.stringify(commitsContributionData));
    return uniqeContributions;
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


//  To filter threshold
// 
// let i =0;
// while(i<detailedSequences.length){
//     let sequence = detailedSequences[i]
//     let commitChanges = sequence.split(" : ")[1].slice(0, -4).split(" ")
//     if (commitChanges.length <= 2) {
//         detailedSequences.splice(i, 1)
//         i--
//     }
//     i++
// }