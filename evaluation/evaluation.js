const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { exec } = require('child_process');
const { evaluationGetMainData, evaluationAnalyzer } = require('../berke');
const { anonymouseName } = require('../computeBerkeResult');

const NUMBER_OF_COMMITS_PER_PROJECT = 5;
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
            "README.md", "readme.md", "Readme.md", "CHANGES.md",
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

        let functionsObjectList = {};
        functionsObjectList = findFunctionsRelations(berkeResult, commitsInfo[commit]['commits'], functionsObjectList)
        functionsObjectList = findFunctionsRelations(tarmaqResult, commitsInfo[commit]['commits'], functionsObjectList)

        berkeResult = replaceKeysWithObjects(berkeResult, functionsObjectList)
        tarmaqResult = replaceKeysWithObjects(tarmaqResult, functionsObjectList)

        commitsInfo[commit]['berke'] = berkeResult
        commitsInfo[commit]['tarmaq'] = tarmaqResult

        let reversedList = {}
        reversedList = reverseFPTARMAQ(reversedList, commitsInfo[commit]['berke']);
        reversedList = reverseFPTARMAQ(reversedList, commitsInfo[commit]['tarmaq']);

        commitsInfo[commit]['reversed-FP-TARMAQ'] = reversedList

        commitsInfo[commit]['reversed-DA'] = reverseDA(commitsInfo[commit]['berke']);

        //  for loop over change-sets and impact-sets and call the following function
        // findFunctionsRelations(impactSet, changes, functionsObjectList)
        // impactSetOrderedList = replaceKeysWithObjects(impactSetOrderedList, functionsObjectList)

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

function tarmaqAndBerkeConsequentStatusUpdate(berkeResult, tarmaqResult) {
    berkeResult.forEach(item => {
        let consequent = item["consequent"]
        let tarmaqItems = tarmaqResult.filter(element => element['consequent'] == consequent || element['consequent'] == anonymouseName(consequent))
        if (tarmaqItems.length != 0) {
            tarmaqItems.forEach(tarmaqItem => tarmaqItem['status'] = STATUS.common)
            item["status"] = STATUS.common;
        } else {
            item["status"] = STATUS.berke_unique;
        }
    });
}

function reverseFPTARMAQ(reversedList, impactSet) {
    impactSet.forEach(impacted => {
        let antecedents = impacted['FP-antecedents']
        if (antecedents != undefined) {
            antecedents.forEach(element => {
                let id = stringfy(element);

                if (reversedList[id] == undefined) {
                    reversedList[id] = [];
                }

                let value = { 'consequent': impacted['consequent'], 'support': impacted['support'], 'confidence': impacted['confidence'], 'DA': impacted['DA-antecedents'], 'evaluation result': '' };

                if (impacted['FP-evaluation'] != undefined) {
                    value['evaluation result'] = impacted['FP-evaluation'];
                }

                reversedList[id].push(value);
            });
        }
    })
    return reversedList
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
                let value = { 'consequent': consequent, 'evaluation result': '' }

                if (impacted['DA-evaluation'] != undefined) {
                    value['evaluation result'] = impacted['DA-evaluation']
                }

                result[id].push(value)
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
        // if (fs.existsSync(TARMAQ_RESULT_PATH)) {
        //     fs.unlinkSync(TARMAQ_RESULT_PATH)
        // }
        // fs.writeFileSync(TARMAQ_RESULT_PATH, "")
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

function findFunctionsRelations(impactSet, changes, functionsObjectList) {
    let impactSetKeys = impactSet.map(item => item['consequent'])
    for (let i = 0; i < impactSetKeys.length; i += 1) {
        let itemi = impactSetKeys[i]
        for (let j = i + 1; j < impactSetKeys.length; j += 1) {
            let itemj = impactSetKeys[j]
            functionsObjectList = setRelations(itemi, itemj, functionsObjectList)
        }

        for (let itemj of changes) {
            functionsObjectList = setRelations(itemi, itemj, functionsObjectList)
        }
    }

    for (let i = 0; i < changes.length; i++) {
        let itemi = changes[i]
        for (let j = i + 1; j < changes.length; j++) {
            functionsObjectList = setRelations(itemi, changes[j], functionsObjectList)
        }
    }
    return functionsObjectList
}

function setRelations(item1, item2, functionsObjectList) {
    let item1_brokenName = item1.split('-')
    let item2_brokenName = item2.split('-')
    let item1_length = item1_brokenName.length
    let item2_length = item2_brokenName.length
    if (item1_brokenName[1] == item2_brokenName[1]) {
        let item1_beginning = parseInt(item1_brokenName[item1_length - 2])
        let item1_end = parseInt(item1_brokenName[item1_length - 1])

        let item2_beginning = parseInt(item2_brokenName[item2_length - 2])
        let item2_end = parseInt(item2_brokenName[item2_length - 1])

        if (item1_beginning <= item2_beginning && item1_end >= item2_end) {
            let item1_object = getOrCreateFunctionObject(item1, functionsObjectList)
            let item2_object = getOrCreateFunctionObject(item2, functionsObjectList)
            item2_object['parents'].push(item1_object['id'])
            functionsObjectList[item2] = item2_object

        } else if (item2_beginning <= item1_beginning && item2_end >= item1_end) {
            let item1_object = getOrCreateFunctionObject(item1, functionsObjectList)
            let item2_object = getOrCreateFunctionObject(item2, functionsObjectList)
            item1_object['parents'].push(item2_object['id'])
            functionsObjectList[item1] = item1_object
        }
    }
    return functionsObjectList
}

function getOrCreateFunctionObject(f, functionsObjectList) {
    if (functionsObjectList[f]) {
        return functionsObjectList[f]
    }

    let object = { "id": Object.keys(functionsObjectList).length, "parents": [] }
    functionsObjectList[f] = object
    return object
}

function replaceKeysWithObjects(impactSetList, functionsObjectList) {
    for (let item of impactSetList) {
        item['consequent'] = getObjectifiedKey(item['consequent'], functionsObjectList)

        let FPAntecedents = item['FP-antecedents']
        if (FPAntecedents != undefined) {
            let objectifiedAntecedents = []
            for (let antecedent of FPAntecedents) {
                objectifiedAntecedents.push(getObjectifiedList(antecedent, functionsObjectList))
            }
            item['FP-antecedents'] = objectifiedAntecedents
        }

        let DAAntecedents = item['DA-antecedents']
        if (DAAntecedents != undefined) {
            item['DA-antecedents'] = getObjectifiedList(DAAntecedents, functionsObjectList);
        }
    }
    return impactSetList
}

function getObjectifiedList(list, functionsObjectList) {
    let objectifiedList = [];
    for (let sub of list) {
        objectifiedList.push(getObjectifiedKey(sub, functionsObjectList));
    }
    return objectifiedList;
}

function getObjectifiedKey(sub, functionsObjectList) {
    let subObject = functionsObjectList[sub];
    let newSub = sub;
    if (subObject != undefined) {
        newSub += stringifyFunctionObject(subObject);
    }
    return newSub;
}

function stringifyFunctionObject(object) {
    function removeDuplicates(arr) {
        return arr.filter((item,
            index) => arr.indexOf(item) === index);
    }

    object['parents'] = removeDuplicates(object['parents'])
    return ` | {"id":${object['id']} - "parents":[${object['parents'].join("-")}]}`
}

module.exports = { STATUS, runTARMAQ, reverseDA, reverseFP: reverseFPTARMAQ, getBerkeResult, tarmaqAndBerkeConsequentStatusUpdate, getTarmaqResult }