const fs = require('fs');
const path = require("path");
const RESULT_PATH = `data${path.sep}ProjectsData${path.sep}`

function commitsLengthDistribution() {
    let filename = process.argv[2];
    let distribution = {}
    let sequences = fs.readFileSync(`${RESULT_PATH}${filename}${path.sep}sequences.txtdetails.txt`).toString().trim().split("\n")
    for (let commit of sequences) {
        let functions = commit.split(" : ")[1].slice(0, -4).split(" ")
        if (distribution[functions.length]) {
            distribution[functions.length] += 1
        } else {
            distribution[functions.length] = 1
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

commitsLengthDistribution()