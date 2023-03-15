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
    let jsonResult = {}
    for (let result of finalResult) {
        let benchmark = result['name']
        delete result['name']
        latexRows[benchmark] = result['latexRow']
        delete result['latexRow']
        jsonResult[benchmark] = result
    }

    console.log("\n ==== results as json === \n")
    console.log(jsonResult)
    console.log("\n ==== latex table === \n")
    console.log(getFullTable(latexRows))
}

function getProjectsInfo(filename) {
    let changeSequences = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences-details.txt`).toString().trim().split("\n")
    let eliminated = fs.readFileSync(`${DATA_PATH}${filename}${path.sep}sequences-eliminated.txt`).toString().trim().split("\n")
    let numberOfUniqueFunctions = uniqueFunctionsCount(changeSequences)
    let { languagesInfo, totalLines } = readBenchmarkLanguagesData(filename);
    let { JsPercentage } = writtenLanguages(languagesInfo, totalLines)
    let benchmarksInfo = {
        "name": filename,
        "# Commits": changeSequences.length + eliminated.length,
        "# Transactions": changeSequences.length,
        "# Unique functions": numberOfUniqueFunctions,
        "KLOC": Math.round(totalLines / 1000),
        "JS (%)": JsPercentage
    }
    let latexRow = benchmarksInfoLatexRow(benchmarksInfo)
    benchmarksInfo['latexRow'] = latexRow
    return benchmarksInfo
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