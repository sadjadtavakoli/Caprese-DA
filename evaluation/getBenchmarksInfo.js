const fs = require('fs');
const path = require("path");
const DATA_PATH = `data${path.sep}ProjectsData${path.sep}`
const { benchmarksInfoLatexRow, getFullTable } = require("./utils")
const { benchmarkList } = require('./evaluationConstants')

if (process.argv[2]) {
    console.log(getProjectsInfo(process.argv[2]).benchmarksInfo)
} else {
    let finalResult = []
    let latexRows = {}
    benchmarkList.forEach(filename => {
        if (fs.statSync(`${DATA_PATH}${filename}`).isDirectory()) {
            let benchmarksInfo = getProjectsInfo(filename)
            finalResult.push(benchmarksInfo)
        }
    });

    finalResult.sort(benchmakrSorter())

    for (let result of finalResult) {
        console.log(result)
        latexRows[result['name']] = result['latexRow']
    }

    console.log(getFullTable(latexRows))
}

function getProjectsInfo(filename) {
    let changeSequences = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences-details.txt`).toString().trim().split("\n")
    let eliminated = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences-eliminated.txt`).toString().trim().split("\n")
    let functionsInCommit = averageFunctionsInCommit(changeSequences)
    let numberOfUniqueFunctions = uniqueFunctionsCount(changeSequences)
    let { languagesInfo, totalLines } = readBenchmarkLanguagesData(filename);
    let { allLanguagesInfo, JsPercentage } = writtenLanguages(languagesInfo, totalLines)
    let benchmarksInfo = {
        "name": filename,
        "# Commits": changeSequences.length + eliminated.length,
        "# Change-sequences": changeSequences.length,
        "Unique #functions": numberOfUniqueFunctions,
        "Avg # functions in commit": functionsInCommit,
        "History (in yrs)": undefined,
        "LOC": Math.round(totalLines / 1000),
        "languages": allLanguagesInfo,
        "JavaScript Percentage": JsPercentage
    }
    let latexRow = benchmarksInfoLatexRow(benchmarksInfo)
    benchmarksInfo['latexRow'] = latexRow
    return benchmarksInfo
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

function benchmakrSorter() {
    return function (a, b) {
        let aCommit = a['# Commits'];
        let bCommit = b['# Commits'];
        let aChangeSequences = a['# Change-sequences'];
        let bChangeSequences = b['# Change-sequences'];

        if (aCommit == bCommit) {
            return aChangeSequences - bChangeSequences;
        }

        return aCommit - bCommit;
    };
}