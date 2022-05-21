const fs = require('fs');
const constants = require('../constants.js');
const path = require("path")

function filterData() {
    let splitter = process.argv[3];
    let targetedFunctions = process.argv[2].split(splitter);
    let patterns = JSON.parse(fs.readFileSync(constants.EXPERIMENTAL_PATTERNS_PATH));
    let filteredPatterns = [];
    for (let pattern of patterns) {
        let diffs = targetedFunctions.filter(item => !pattern[0].includes(item.trim()));
        if (!diffs.length) {
            filteredPatterns.push(pattern);
        }
    }
    console.log("\n - - - - - - - - - - Patterns - - - - - - - - - - - ");
    console.log(filteredPatterns);


    filteredPatterns = [];
    let sequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");

    for (let sequence of sequences) {
        let diffs = targetedFunctions.filter(item => !sequence.split(" : ")[1].includes(item));
        if (!diffs.length) {
            filteredPatterns.push(sequence);
        }
    }
    console.log("\n - - - - - - - - - - Sequences - - - - - - - - - - - ");
    console.log(filteredPatterns);
}

function commitsLengthDistribution() {
    const resultDirPath = `data${path.sep}ProjectsData${path.sep}`
    let finalResult = {}
    fs.readdirSync(resultDirPath).forEach(filename => {
        if (fs.statSync(`${resultDirPath}${filename}`).isDirectory()) {
            let distribution = {}
            let result = fs.readFileSync(`${resultDirPath}${filename}${path.sep}sequences.txtdetails.txt`).toString().trim().split("\n")
            for (let commit of result) {
                let commitems = commit.split(" : ")[1].slice(0, -4).split(" ")
                if(distribution[commitems.length]){
                    distribution[commitems.length]+=1
                }else{
                    distribution[commitems.length] = 1
                }
            }
            keys = []
            values = []
            for(let key in distribution){
                keys.push(key)
                values.push(distribution[key])
            }
            finalResult[filename] = {"keys": keys, "values": values}
        }
    });
    console.log(JSON.stringify(finalResult))
}

commitsLengthDistribution()