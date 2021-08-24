const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
let repo = "https://github.com/vuejs/vuex.git"
let dataPath = __dirname + path.sep + "sequences.txt"
let DistPath = __dirname + path.sep + "patterns.json"
// let DistPath = null
let digDepth = 200;
const refDiffPath = __dirname + path.sep + "refdiff"
const claspPath = __dirname + path.sep + "clasp"

// TODO RefDiff repo would be part of this directory
const computeChangesCommands = "cd " + refDiffPath + " ; ./gradlew run --args=";
const patternDetectionCommand = "cd " + claspPath + " ; mvn exec:java -Dexec.mainClass='clasp_AGP.MainCMClaSP' -Dexec.args="
function run() {
    let commit = "8029c3951af788eb0e704222ff1b0a21918546c1"
    let commitArg = process.argv[2]
    let repoArg = process.argv[3]
    if (commitArg != undefined) commit = commitArg
    if (repoArg != undefined) repo = repoArg
    // runClasp()
    runAnalysisBasedOnchanges(runClasp)


    function runAnalysisBasedOnchanges(callback) {
        exec(computeChangesCommands + `"${repo} ${commit} ${dataPath} ${digDepth}"`, (err, stdout, stderr) => {
            if (!err) {
                console.log(stdout)
                callback()
            }
            else {
                console.log(stderr)
            }
        })
    }

    function runClasp() {
        let itemconstraintlist = ["test1", "test2"]
        console.log(patternDetectionCommand + `"${dataPath} ${DistPath} ${itemconstraintlist}"`)
        exec(patternDetectionCommand + `"${dataPath} ${DistPath} ${itemconstraintlist}"`, (err, stdout, stderr) => {
            if (!err) {
                console.log(stdout)
            }
            else {
                console.log(stderr)
            }
        })
    }
}

console.log(" * * * * * * * * * * * ")
console.log(" * * * *  Srart! * * * ")
console.log(" * * * * * * * * * * * ")

run()
