const path = require('path');
const fs = require('fs');
const constants = require('../constants.js');

// The list of benchmarks for the evaluation 
const benchmarkList = ["bignumber.js", "session", "jhipster-uml", "grant", "environment", "cla-assistant", "assemble", "nock", "fastify", "express"]

// The number of random change sets
const NUMBER_OF_COMMITS_PER_PROJECT = 10;

const BENCHMARK_DIR = `${__dirname}${path.sep}benchmarks`
const PROJECT_DIR = `${BENCHMARK_DIR}${path.sep}${constants.PROJECT_NAME}`;

if (!fs.existsSync(PROJECT_DIR)) {
    fs.mkdirSync(PROJECT_DIR, {
        recursive: true
    });
}

const EXECUTION_TIMES_PATH = `${BENCHMARK_DIR}${path.sep}executionTimeAll.json`
const TARMAQ_RESULT_PATH = `${PROJECT_DIR}${path.sep}tarmaq.json`
const TARMAQ_PATH = `${__dirname}${path.sep}TARMAQ`;
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";

function getActualImpactSetPath(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}actualImpactSets.json`
}

function getDetectedImpactSetResultsPath(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}detectedImpactSetsResults.json`
}

function getDetectedImpactSetPath(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}detectedImpactSets.json`
}

function getChangeSetPath(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}changeSets.json`
}

function getProjectDir(benchmark) {
    return benchmark != undefined ? `${BENCHMARK_DIR}${path.sep}${benchmark}` : PROJECT_DIR
}

const STATUS = {
    removed: "Removed"
}


module.exports = {
    benchmarkList, NUMBER_OF_COMMITS_PER_PROJECT, STATUS, TARMAQ_PATH, getDetectedImpactSetPath,
    EXECUTION_TIMES_PATH, getActualImpactSetPath, getDetectedImpactSetResultsPath,
    TARMAQ_RESULT_PATH, TARMAQ_COMMAND, getChangeSetPath
}