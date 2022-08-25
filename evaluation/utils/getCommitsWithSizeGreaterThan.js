const fs = require('fs');
const path = require("path");
const RESULT_PATH = `data${path.sep}ProjectsData${path.sep}`

function getCommitsWithLengthGreaterThan() {
    let benchmarkName = process.argv[2];
    let N = process.argv[3];
    let FN = process.argv[4]
    let finalResult = []
    let commits = fs.readFileSync(`${RESULT_PATH}${benchmarkName}${path.sep}sequences.txtdetails.txt`).toString().trim().split("\n")
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

getCommitsWithLengthGreaterThan()