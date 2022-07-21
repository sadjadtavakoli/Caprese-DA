const fs = require('fs');
const constants = require('../constants.js');
const path = require("path");

function filterData() {
    let splitter = process.argv[3];
    let targetedFunctions = process.argv[2].split(splitter);

    // to match the output of berke
    targetedFunctions = targetedFunctions.map(item => item.split(" | ")[0])

    let relatedSequences = [];
    let sequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");

    for (let sequence of sequences) {
        let diffs = targetedFunctions.filter(item => !sequence.split(" : ")[1].includes(item));
        if (!diffs.length) {
            relatedSequences.push(sequence);
        }
    }
    console.log("\n - - - - - - - - - - Sequences - - - - - - - - - - - ");
    console.log(relatedSequences);
}

function commitsLengthDistribution() {
    let filename = process.argv[2];
    const resultDirPath = `data${path.sep}ProjectsData${path.sep}`
    let distribution = {}
    let result = fs.readFileSync(`${resultDirPath}${filename}_up-to-date${path.sep}sequences.txtdetails.txt`).toString().trim().split("\n")
    for (let commit of result) {
        let commitems = commit.split(" : ")[1].slice(0, -4).split(" ")
        if (distribution[commitems.length]) {
            distribution[commitems.length] += 1
        } else {
            distribution[commitems.length] = 1
        }
    }
    let keys = []
    let values = []
    for (let key in distribution) {
        keys.push(key)
        values.push(distribution[key])
    }

    console.log({ "keys": keys, "values": values })
}

function getCommitsWithLengthGreaterThan() {
    let filename = process.argv[2];
    let N = process.argv[3];
    let FN = process.argv[4]
    const resultDirPath = `data${path.sep}ProjectsData${path.sep}`
    let finalResult = []
    let commits = fs.readFileSync(`${resultDirPath}${filename}_up-to-date${path.sep}sequences.txtdetails.txt`).toString().trim().split("\n")
    for (let commit of commits) {
        let functions = commit.split(" : ")[1].slice(0, -4).split(" ")
        if (functions.length >= N) {
            if (FN != undefined) {
                if (functions.length < FN) {
                    finalResult.push([commit.split(" : ")[0], functions.length])
                }
            } else {
                finalResult.push([commit.split(" : ")[0], functions.length])
            }

        }
    }
    console.log(JSON.stringify(finalResult))
}

filterData()