const path = require('path');
const fs = require('fs');
const { ArgumentParser } = require('argparse');
const { version } = require('./package.json');
const { exec } = require('child_process');
const constants = require('./constants.js');
const { computeCapreseResult } = require("./computeCapreseResult");

const parser = new ArgumentParser({
    add_help: true,
    description: `Node.js dynamic dependency graph extractor version ${version}`,
});


parser.add_argument('-v', '--vaersion',  { action: 'version', version: version})

let changeSet = []

if (!fs.existsSync(constants.DATA_PATH)) {
    fs.mkdirSync(constants.DATA_PATH, {
        recursive: true
    });
}

if (process.argv[1].endsWith(path.basename(__filename))) {
    if (process.argv[2] == "da") {
        daCommand(constants.SEED_COMMIT)
    } else if (process.argv[2] == "detect") {
        changeSet = process.argv[3].split(" ")
        console.log(changeSet)
        detectCommand(changeSet)
    } else {
        console.error("Invalid command.")
        console.error("Please specify either 'da' or 'detect'")
    }
}

async function daCommand(commit) {
    await checkoutProject(commit)
    await runDynamicAnalysis()
}

async function detectCommand(changeSet) {
    console.log(" = = = Run Caprese = = = ")
    computeCapreseResult(changeSet, "capreseResult.json")
}

async function checkoutProject(commit) {
    console.log(" = = = Checkout Project = = = ")
    const checkoutCommand = `cd ${constants.REPO_PATH}\ngit checkout ${commit}`
    return runCommand(checkoutCommand)
}

async function runDynamicAnalysis() {
    console.log(" = = = Run Dynamic Anlaysis = = = ")
    console.log(constants.DA_COMMAND)
    return runCommand(constants.DA_COMMAND, true)
}

function runCommand(command, logReport = false) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (!err) {
                resolve(stdout.trimEnd())
                if (logReport) console.log(stdout.trimEnd())
            } else {
                reject(err)
                if (logReport) console.log(stderr.trimEnd())
            }
        })
    })
}

module.exports = { runDynamicAnalysis }