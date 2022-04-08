const fs = require('fs');
const constants = require('../constants.js');
let splitter = process.argv[3]
let targetedFunctions = process.argv[2].split(splitter)
let patterns = JSON.parse(fs.readFileSync(constants.EXPERIMENTAL_PATTERNS_PATH));
let filteredPatterns = []
for (let pattern of patterns) {
    let diffs = targetedFunctions.filter(item => !pattern[0].includes(item.trim()))
    if (!diffs.length) {
        filteredPatterns.push(pattern)
    }
}
console.log("\n - - - - - - - - - - Patterns - - - - - - - - - - - ")
console.log(filteredPatterns)


filteredPatterns = []
let sequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");

for (let sequence of sequences) {
    let diffs = targetedFunctions.filter(item => !sequence.split(" : ")[1].includes(item))
    if (!diffs.length) {
        filteredPatterns.push(sequence)
    }
}
console.log("\n - - - - - - - - - - Sequences - - - - - - - - - - - ")
console.log(filteredPatterns)
