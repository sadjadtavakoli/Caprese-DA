const fs = require('fs');
const path = require("path");
const DATA_PATH = `data${path.sep}ProjectsData${path.sep}`

if (process.argv[2]) {
    console.log(getProjectsInfo(process.argv[2]))
} else {
    let finalResult = {}
    fs.readdirSync(DATA_PATH).forEach(filename => {
        if (fs.statSync(`${DATA_PATH}${filename}`).isDirectory()) {
            finalResult[filename] = getProjectsInfo(filename)
        }
    });
    console.log(finalResult)
}

function getProjectsInfo(filename) {
    let changeSequences = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences.txt`).toString().trim().split("\n")
    let eliminated = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences.txt-eliminated.txt`).toString().trim().split("\n")
    let functionsInCommit = averageFunctionsInCommit(changeSequences)
    let numberOfUniqueFunctions = uniqueFunctionsCount(changeSequences)

    return {
        "totalCommits": changeSequences.length + eliminated.length,
        "change-sequences": changeSequences.length,
        "number of unique functions": numberOfUniqueFunctions,
        "average function in commit": functionsInCommit
    }
}

function averageFunctionsInCommit(changeSequences) {
    let totalFunctions = 0;

    for (let commit of changeSequences) {
        totalFunctions += commit.slice(0, -4).split(" ").length
    }
    return totalFunctions / changeSequences.length
}

function uniqueFunctionsCount(changeSequences) {
    let uniqueFunctions = new Set();
    for (let commit of changeSequences) {
        let functions = commit.slice(0, -4).split(" ")
        functions.forEach(item => {
            uniqueFunctions.add(item)
        })
    }
    return uniqueFunctions.size
}