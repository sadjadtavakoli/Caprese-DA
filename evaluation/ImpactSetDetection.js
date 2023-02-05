const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { exec } = require('child_process');
const { evaluationAnalyzer } = require('../berke');
const { anonymouseName } = require('../computeBerkeResult');
const { CHANGE_SET_PATH, STATUS, DETECTED_IMPACT_SETS_PATH, APPROACHES } = require('./evaluationConstants')

const TARMAQ_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "TARMAQ";
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";
const TARMAQ_RESULT_PATH = `${RESULT_DIR_PATH}${path.sep}tarmaq.json`

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
        let commitsInfo = JSON.parse(fs.readFileSync(CHANGE_SET_PATH));

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
        for(let commit in commitsInfo){
            let emptyBody = new Map()
            emptyBody.set(APPROACHES.caprese, [])
            emptyBody.set(APPROACHES.tarmaq, [])
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

        let {capreseResult, tarmaqResult} = getBothApproachsResult()

        impactSet[commit][APPROACHES.caprese] = capreseResult
        impactSet[commit][APPROACHES.tarmaq] = tarmaqResult

        fs.writeFileSync(CHANGE_SET_PATH, JSON.stringify(commitsInfo));
        resolve();
    })
}

function getBothApproachsResult(){

    let tarmaqResult = getTarmaqResult();
    let capreseResult = getBerkeResult();

    tarmaqAndBerkeConsequentStatusUpdate(capreseResult, tarmaqResult);

    let functionsObjectList = {};
    functionsObjectList = findFunctionsRelations(capreseResult, commitsInfo[commit]['commits'], functionsObjectList)
    functionsObjectList = findFunctionsRelations(tarmaqResult, commitsInfo[commit]['commits'], functionsObjectList)

    capreseResult = replaceKeysWithObjects(capreseResult, functionsObjectList)
    tarmaqResult = replaceKeysWithObjects(tarmaqResult, functionsObjectList)

    return {capreseResult, tarmaqResult}

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

module.exports = { runTARMAQ, getBerkeResult, tarmaqAndBerkeConsequentStatusUpdate, getTarmaqResult }