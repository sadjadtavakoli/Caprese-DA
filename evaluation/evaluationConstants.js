const path = require('path');
const fs = require('fs');
const constants = require('../constants.js');

const benchmarkList = ["bignumber.js", "session", "jhipster-uml", "neo-async", "markdown-it", "grant", "environment", "cla-assistant", "nodejs-cloudant", "ws", "assemble", "nock", "eslint-plugin-react", "fastify", "express"] // in order 

const NUMBER_OF_COMMITS_PER_PROJECT = 10;
const BENCHMARK_DIR = `${__dirname}${path.sep}benchmarks`
const PROJECT_DIR = `${BENCHMARK_DIR}${path.sep}${constants.PROJECT_NAME}`;

if (!fs.existsSync(PROJECT_DIR)) {
    fs.mkdirSync(PROJECT_DIR, {
        recursive: true
    });
}

const EXECUTION_TIMES_PATH = `${BENCHMARK_DIR}${path.sep}executionTimeAll.json`
const CHANGE_SET_PATH = `${PROJECT_DIR}${path.sep}changeSets.json`
const ACTUAL_IMPACT_SET_PATH = `${PROJECT_DIR}${path.sep}actualImpactSets.json`
const ALL_IMPACTED_ENTITIES_CSV = `${PROJECT_DIR}${path.sep}allImpactedEntities.csv`
const DETECTED_IMPACT_SETS_PATH = `${PROJECT_DIR}${path.sep}detectedImpactSets.json`
const TARMAQ_RESULT_PATH = `${PROJECT_DIR}${path.sep}tarmaq.json.json`
const TARMAQ_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "TARMAQ";
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";

function getActualImpactSetPath(benchmark) {
    if (benchmark != undefined) {
        let projectDir = `${BENCHMARK_DIR}${path.sep}${benchmark}`;
        return `${projectDir}${path.sep}actualImpactSets.json`
    } else {
        return ACTUAL_IMPACT_SET_PATH
    }
}

function getDetectedImpactSetPath(benchmark) {
    if (benchmark != undefined) {
        let projectDir = `${BENCHMARK_DIR}${path.sep}${benchmark}`;
        return `${projectDir}${path.sep}detectedImpactSets.json`
    } else {
        return DETECTED_IMPACT_SETS_PATH
    }
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
    benchmarkList, NUMBER_OF_COMMITS_PER_PROJECT, CHANGE_SET_PATH, STATUS, ALL_IMPACTED_ENTITIES_CSV,
    APPROACHES, EXECUTION_TIMES_PATH, getActualImpactSetPath, getDetectedImpactSetPath, TARMAQ_PATH, 
    TARMAQ_RESULT_PATH, TARMAQ_COMMAND
}