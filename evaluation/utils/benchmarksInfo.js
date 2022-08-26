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
    let changeSequences = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences.txtdetails.txt`).toString().trim().split("\n")
    let eliminated = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences.txt-eliminated.txt`).toString().trim().split("\n")
    let functionsInCommit = averageFunctionsInCommit(changeSequences)
    let numberOfUniqueFunctions = uniqueFunctionsCount(changeSequences)
    let { languagesInfo, totalLines } = readBenchmarkLanguagesData(filename);
    let languages = writtenLanguages(languagesInfo, totalLines)

    return {
        "totalCommits": changeSequences.length + eliminated.length,
        "change-sequences": changeSequences.length,
        "number of unique functions": numberOfUniqueFunctions,
        "average function in commit": functionsInCommit,
        "languages": languages,
        "LOC": totalLines
    }
}

function averageFunctionsInCommit(changeSequences) {
    let totalFunctions = 0;

    for (let commit of changeSequences) {
        totalFunctions += commit.split(" : ")[1].slice(0, -4).split(" ").length
    }
    return totalFunctions / changeSequences.length
}

function uniqueFunctionsCount(changeSequences) {
    let uniqueFunctions = new Set();
    for (let commit of changeSequences) {
        let functions = commit.split(" : ")[1].slice(0, -4).split(" ")
        functions.forEach(item => {
            uniqueFunctions.add(item)
        })
    }
    return uniqueFunctions.size
}

function writtenLanguages(languages, totalLines) {
    let languagesInfo = ""
    let rest = 0;

    for (let languageInfo of languages) {
        let language = languageInfo['language']
        let linesOfCode = languageInfo['linesOfCode']
        let ratio = (linesOfCode / totalLines) * 100
        if (ratio > 5) languagesInfo += `${language} (%${Math.round(ratio)}), `
        else rest += ratio
    }

    languagesInfo += `Others (%${Math.round(rest)})`
    return languagesInfo
}

function readBenchmarkLanguagesData(filename) {
    const BENCHMARKS_PATH = `evaluation/benchmarks/benchmarksDataWritenLanguage.json`;
    let benchmarks = JSON.parse(fs.readFileSync(BENCHMARKS_PATH));
    let github = Object.keys(benchmarks).find(element => element.split("/")[1].includes(filename));
    let languagesInfo = benchmarks[github];
    let total = languagesInfo.pop();
    let totalLines = total['linesOfCode'];
    return { languagesInfo, totalLines };
}