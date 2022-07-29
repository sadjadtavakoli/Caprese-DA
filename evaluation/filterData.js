const fs = require('fs');
const constants = require('../constants.js');

function filterData() {
    let splitter = process.argv[3];
    let targetedFunctions = process.argv[2].split(splitter);

    // to match the output of berke
    targetedFunctions = targetedFunctions.map(item => item.split(" | ")[0])

    let relatedSequences = [];
    let sequences = fs.readFileSync(constants.SEQUENCES_PATH + "details.txt").toString().trim().split("\n");

    for (let sequence of sequences) {
        let commit = sequence.split(" : ")[0]
        let changes = sequence.split(" : ")[1]
        let diffs = targetedFunctions.filter(item => !changes.includes(item));
        if (!diffs.length) {
            relatedSequences.push(commit);
        }
    }
    console.log("\n - - - - - - - - - - Sequences - - - - - - - - - - - ");
    relatedSequences.forEach(item=>console.log(item))
}

filterData()