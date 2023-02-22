const path = require('path');
const fs = require('fs');
const constants = require('../constants.js');

// const benchmarkList = ["bignumber.js", "session", "jhipster-uml", "neo-async", "markdown-it", "grant", "environment", "cla-assistant", "nodejs-cloudant", "ws", "assemble", "nock", "eslint-plugin-react", "fastify", "express"] // in order 
// const benchmarkList = ["bignumber.js", "session", "jhipster-uml", "grant", "environment", "cla-assistant", "assemble", "nock", "fastify", "express"] // 10 selected benchmarks
const benchmarkList = ["bignumber.js", "session", "assemble", "nock"] // 10 selected benchmarks
// const benchmarkList = [constants.PROJECT_NAME] // done benchmarks
// const benchmarkList = ["trueFalsePositiveTest"] // test

const NUMBER_OF_COMMITS_PER_PROJECT = 10;
const BENCHMARK_DIR = `${__dirname}${path.sep}benchmarks`
const PROJECT_DIR = `${BENCHMARK_DIR}${path.sep}${constants.PROJECT_NAME}`;

if (!fs.existsSync(PROJECT_DIR)) {
    fs.mkdirSync(PROJECT_DIR, {
        recursive: true
    });
}

const EXECUTION_TIMES_PATH = `${BENCHMARK_DIR}${path.sep}executionTimeAll.json`
const TARMAQ_RESULT_PATH = `${PROJECT_DIR}${path.sep}tarmaq.json.json`
const TARMAQ_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "TARMAQ";
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";

function getActualImpactSetPath(benchmark) {
    let projectDir = benchmark != undefined ? `${BENCHMARK_DIR}${path.sep}${benchmark}` : PROJECT_DIR
    return `${projectDir}${path.sep}actualImpactSets.json`
}

function getDetectedImpactSetPath(benchmark) {
    let projectDir = benchmark != undefined ? `${BENCHMARK_DIR}${path.sep}${benchmark}` : PROJECT_DIR
    return `${projectDir}${path.sep}detectedImpactSets.json`
}

function getOriginalImpactSetPath(benchmark) {
    let projectDir = benchmark != undefined ? `${BENCHMARK_DIR}${path.sep}${benchmark}` : PROJECT_DIR
    return `${projectDir}${path.sep}originalDetectedImpactSets.json`
}

function getImpactSetCSVs(benchmark) {
    let projectDir = benchmark != undefined ? `${BENCHMARK_DIR}${path.sep}${benchmark}` : PROJECT_DIR
    return `${projectDir}${path.sep}allImpactedEntities.csv`
}

function getChangeSetPath(benchmark) {
    let projectDir = benchmark != undefined ? `${BENCHMARK_DIR}${path.sep}${benchmark}` : PROJECT_DIR
    return `${projectDir}${path.sep}changeSets.json`
}

const STATUS = {
    berke_unique: "Berke Unique",
    tarmaq_unique: "TARMAQ Unique",
    common: "common",
    removed: "Removed"
}

const APPROACHES = {
    caprese: "caprese",
    tarmaq: "tarmaq"
}


module.exports = {
    benchmarkList, NUMBER_OF_COMMITS_PER_PROJECT, STATUS, TARMAQ_PATH, getOriginalImpactSetPath,
    APPROACHES, EXECUTION_TIMES_PATH, getActualImpactSetPath, getDetectedImpactSetPath,
    TARMAQ_RESULT_PATH, TARMAQ_COMMAND, getImpactSetCSVs, getChangeSetPath
}