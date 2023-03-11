const constants = require('../constants.js');
const fs = require('fs');
const path = require('path')
const { NUMBER_OF_COMMITS_PER_PROJECT, getChangeSetPath } = require('./evaluationConstants')

if (process.argv[1].endsWith(path.basename(__filename))) {
    testSetGenerator()
}

function testSetGenerator() {
    console.log(" * * * testset Generator * * * ")
    let detailedSequences = fs.readFileSync(constants.SEQUENCES_PATH + "-details.txt").toString().trim().split("\n");
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(" ");
    let candidatedCommits = new Map()
    let maxIndex = detailedSequences.length - 1

    while (candidatedCommits.size < NUMBER_OF_COMMITS_PER_PROJECT) {
        let i = getRandomNumbers(maxIndex)
        let sequence = detailedSequences[i]
        let commit = sequence.split(" : ")[0]
        let commitChanges = sequence.split(" : ")[1].slice(0, -4).split(" ").filter(item => filter(item, removed))
        if (commitChanges.length <= 1 || includes(candidatedCommits, commitChanges)) {
            continue
        }
        console.log(`random i = ${i}`)
        maxIndex -= 1
        candidatedCommits.set(commit, { "changes": commitChanges })
        detailedSequences.splice(i, 1)
    }

    detailedSequences = detailedSequences.map(item => item.split(" : ")[1])
    fs.writeFileSync(getChangeSetPath(), JSON.stringify(Object.fromEntries(candidatedCommits)))
    fs.writeFileSync(constants.SEQUENCES_PATH + ".txt", detailedSequences.join("\n"));

    function filter(item, removed) {
        return !removed.includes(item) & !item.includes("test") & !item.includes(".md") & !item.includes(".yml") & !item.includes(".html") & !item.includes(".json")
    }
}


function getRandomNumbers(maximum) {
    return Math.floor(Math.random() * maximum)
}

function includes(mapArr, array) {
    for (let item of mapArr) {
        let changes = item[1]['changes']
        if (areEquals(changes, array)) {
            return true
        }
    }
    return false
}

function areEquals(array1, array2) {
    array2 = array2.filter(item => !item.endsWith(".json"))
    array1 = array1.filter(item => !item.endsWith(".json"))
    if (array1.length != array2.length) return false
    return array2.filter(item => !array1.includes(item)).length == 0
}