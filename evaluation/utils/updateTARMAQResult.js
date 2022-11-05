const constants = require('../../constants.js');
const fs = require('fs');
const path = require('path')

const { STATUS, reverseDA, reverseFP, tarmaqAndBerkeConsequentStatusUpdate} = require('../evaluation')

const RESULT_DIR_PATH = `${path.dirname(__dirname)}${path.sep}result${path.sep}${constants.PROJECT_NAME}`;

const RESULT_PATH = `${RESULT_DIR_PATH}${path.sep}results.json`

if (process.argv[1].endsWith(path.basename(__filename))) {

    if (!fs.existsSync(RESULT_DIR_PATH)) {
        fs.mkdirSync(RESULT_DIR_PATH, {
            recursive: true
        });
    }

    testSetGenerator()
        .then((candidatedCommits) => {
            let testSet = [...candidatedCommits.keys()]
            testSet = testSet.reduce(
                (p, x) => p.then(() => {
                    let commitX = candidatedCommits.get(x)
                    return collectResult(commitX)
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
        let commitsInfo = JSON.parse(fs.readFileSync(RESULT_PATH));

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

        let reversedList = new Map()
        for (let commit in commitsInfo) {
            reversedList.set(commitsInfo[commit]['commits'], commit)
        }
        // reverse commits' info and pass the list of candidate changes and commits to resolve.
        // or simply pass it as a list of 2-length lists which the first item is the commit sha and the second one is its changes
        // detailedSequences = detailedSequences.map(item => item.split(" : ")[1])
        // fs.writeFileSync(constants.SEQUENCES_PATH, detailedSequences.join("\n"));

        resolve(reversedList)
    })
}

function collectResult(commit) {
    console.log(" = = = Collect Result = = = ")
    return new Promise(function (resolve, reject) {

        let commitsInfo = JSON.parse(fs.readFileSync(RESULT_PATH));

        let tarmaqResult = commitsInfo[commit]['tarmaq'];
        let berkeResult = getBerkeResult(commitsInfo[commit]['berke']);
    
        tarmaqAndBerkeConsequentStatusUpdate(berkeResult, tarmaqResult);

        let reversedFP = reverseFP(berkeResult);
        let reversedDA = reverseDA(berkeResult);

        let oldDataMap = new Map();
        commitsInfo[commit]['berke'].forEach(item => oldDataMap.set(item['consequent'].split(" | ")[0], item))

        for (let reversedFPItem in reversedFP) {
            let newIS = reversedFP[reversedFPItem]
            newIS = newIS.map(item => {
                let consequent = item['consequent'].split(" | ")[0]
                let oldResult = oldDataMap.get(consequent)
                if (oldResult != undefined && oldResult['FP-evaluation'] != undefined) {
                    item['evaluation result'] = oldResult['FP-evaluation']
                }
                return item
            })
        }
    
        for (let reversedDAItem in reversedDA) {
            let newIS = reversedDA[reversedDAItem]
            newIS = newIS.map(item => {
                let consequent = item['consequent'].split(" | ")[0]
                let oldResult = oldDataMap.get(consequent)
                if (oldResult != undefined && oldResult['DA-evaluation'] != undefined) {
                    item['evaluation result'] = oldResult['DA-evaluation']
                }
                return item
            })
        }
        
        for (let item of berkeResult) {
            let consequent = item['consequent'].split(" | ")[0]
            let oldResult = oldDataMap.get(consequent)
            if (oldResult != undefined) {
                item['DA-evaluation'] = oldResult['DA-evaluation']
                item['FP-evaluation'] = oldResult['FP-evaluation']
            }
        }

        for (let item of tarmaqResult) {
            let consequent = item['consequent'].split(" | ")[0]
            let oldResult = oldDataMap.get(consequent)
            if (oldResult != undefined) {
                item['FP-evaluation'] = oldResult['FP-evaluation']
            }
        }

        commitsInfo[commit]['berke'] = berkeResult
        commitsInfo[commit]['tarmaq'] = tarmaqResult
        commitsInfo[commit]['reversed-FP'] = reversedFP
        commitsInfo[commit]['reversed-DA'] = reversedDA

        fs.writeFileSync(RESULT_PATH, JSON.stringify(commitsInfo));
        resolve();
    })
}

function getTarmaqResult(tarmaqResult) {
    // before goign through the following code, reset all tarmaq not REMOVED items status to tarmaq_unique
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(" ");
 
    tarmaqResult = tarmaqResult.map(item => {
        if (item['status'] == STATUS.common) {
            item['status'] = STATUS.tarmaq_unique
        }
        if (removed.includes(item['consequent'])) {
            item['status'] = STATUS.removed;
            delete item['FP-evaluation']
        }
        return item
    })
    return tarmaqResult;
}

function getBerkeResult(berkeResult) {
    berkeResult = berkeResult.map(item => {
        if (item['status'] == STATUS.common) {
            item['status'] = STATUS.berke_unique
        }
        return item
    })
    return berkeResult;
}