const fs = require('fs');
const path = require("path");
const DATA_PATH = `data${path.sep}ProjectsData${path.sep}`
const { benchmarksInfoLatexRow, getFullTable } = require("./jsonToLatexRow")

if (process.argv[2]) {
    console.log(getProjectsInfo(process.argv[2]).benchmarksInfo)
} else {
    let finalResult = {}
    let projects_list = ["ws", "cla-assistant", "grant", "markdown-it", "environment", "nodejs-cloudant", "assemble", "express", "session"]
    let latexRows = {}
    projects_list.forEach(filename => {
        if (fs.statSync(`${DATA_PATH}${filename}`).isDirectory()) {
            let { benchmarksInfo, latexRow } = finalResult[filename] = getProjectsInfo(filename)
            console.log(benchmarksInfo)
            latexRows[filename] = latexRow
        }
    });
    console.log(getFullTable(latexRows))
}

function getProjectsInfo(filename) {
    let changeSequences = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences.txtdetails.txt`).toString().trim().split("\n")
    let eliminated = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences.txt-eliminated.txt`).toString().trim().split("\n")
    let functionsInCommit = averageFunctionsInCommit(changeSequences)
    let numberOfUniqueFunctions = uniqueFunctionsCount(changeSequences)
    let { languagesInfo, totalLines } = readBenchmarkLanguagesData(filename);
    let { allLanguagesInfo, JsPercentage } = writtenLanguages(languagesInfo, totalLines)
    let benchmarksInfo = {
        "# Commits": changeSequences.length + eliminated.length,
        "# Change-sequences": changeSequences.length,
        "Unique #functions": numberOfUniqueFunctions,
        "Avg # functions in commit": functionsInCommit,
        "History (in yrs)": undefined,
        "LOC": totalLines,
        "languages": allLanguagesInfo,
        "JavaScript Percentage": JsPercentage
    }
    let latexRow = benchmarksInfoLatexRow(benchmarksInfo)
    return { benchmarksInfo, latexRow }
}

function averageFunctionsInCommit(changeSequences) {
    let totalFunctions = 0;

    for (let commit of changeSequences) {
        totalFunctions += commit.split(" : ")[1].slice(0, -4).split(" ").length
    }
    return (totalFunctions / changeSequences.length).toFixed(2)
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
    let allLanguagesInfo = ""
    let rest = 0;
    let JsPercentage = 0;
    for (let languageInfo of languages) {
        let language = languageInfo['language']
        let linesOfCode = languageInfo['linesOfCode']
        let ratio = (linesOfCode / totalLines) * 100
        if (ratio > 5) allLanguagesInfo += `${language} (%${Math.round(ratio)}), `
        else rest += ratio
        if (language == "JavaScript") {
            JsPercentage = ratio.toFixed(2)
        }
    }

    allLanguagesInfo += `Others (%${Math.round(rest)})`
    return { allLanguagesInfo, JsPercentage }
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