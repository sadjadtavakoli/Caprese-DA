const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
let repo = "https://github.com/vuejs/vuex.git"
let dataPath = __dirname + path.sep + "sequences.txt"

const refDiffPath = __dirname + path.sep + "refdiff"

// TODO RefDiff repo would be part of this directory
const computeChangesCommands = "cd " + refDiffPath + " ; ./gradlew run --args=";
function run() {
    let commit = "8029c3951af788eb0e704222ff1b0a21918546c1"
    let commitArg = process.argv[2]
    let repoArg = process.argv[3]
    if (commitArg != undefined) {
        commit = commitArg
    }
    if (repoArg != undefined) {
        repo = repoArg
    }
    runAnalysisBasedOnchanges(runClasp)


    function runAnalysisBasedOnchanges(callback) {
        exec(computeChangesCommands + `"${repo} ${commit} ${dataPath}"`, (err, stdout, stderr) => {
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
        const data = fs.readFileSync(dataPath, 'utf8')
        console.log(data)

        //  now I can call pattern detection method 
    }
}

console.log(" * * * * * * * * * * * ")
console.log(" * * * *  Srart! * * * ")
console.log(" * * * * * * * * * * * ")

run()
