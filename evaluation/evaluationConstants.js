const path = require('path');
const fs = require('fs');
const constants = require('../constants.js');

const benchmarkList = ["bignumber.js", "session", "jhipster-uml", "grant", "environment", "cla-assistant", "assemble", "nock", "fastify", "express"] // in order 

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
const TARMAQ_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "TARMAQ";
const TARMAQ_COMMAND = "cd " + TARMAQ_PATH + " ; mvn exec:java -Dexec.mainClass='TARMAQ.MainTARMAQ' -Dexec.args=";

const SPMF_PATH = path.dirname(path.dirname(__dirname)) + path.sep + "spmf-3";

const CLASP_COMMAND = "cd " + SPMF_PATH + " ; java -Xmx16g ca/pfv/spmf/test/MainTestClaSP_saveToFile ";

const CMCLASP_COMMAND = "cd " + SPMF_PATH + " ; java -Xmx16g ca/pfv/spmf/test/MainTestCMClaSP_saveToFile ";

const SPADE_COMMAND = "cd " + SPMF_PATH + " ; java -Xmx16g ca/pfv/spmf/test/MainTestSPADE_AGP_BitMap_saveToFile ";

function getActualImpactSetPath(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}actualImpactSets.json`
}

function getDetectedImpactSetPath(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}detectedImpactSets.json`
}

function getOriginalImpactSetPath(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}originalDetectedImpactSets.json`
}

function getImpactSetCSVs(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}allImpactedEntities.csv`
}

function getChangeSetPath(benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}changeSets.json`
}

function getCMClaspResultPath(support) {
    return `${PROJECT_DIR}${path.sep}cm-clasp${support}.json`
}

function getCMClaspPatternPath(support) {
    return `${PROJECT_DIR}${path.sep}cm-clasp-patterns${support}.txt`
}

function getClaspResultPath(support) {
    return `${PROJECT_DIR}${path.sep}clasp${support}.json`
}

function getClaspPatternPath(support) {
    return `${PROJECT_DIR}${path.sep}clasp-patterns${support}.txt`
}

function getSPADEResultPath(support) {
    return `${PROJECT_DIR}${path.sep}spade${support}.json`
}

function getSPADEPatternPath(support, benchmark) {
    return `${getProjectDir(benchmark)}${path.sep}spade-patterns${support}.txt`
}

function getProjectDir(benchmark) {
    return benchmark != undefined ? `${BENCHMARK_DIR}${path.sep}${benchmark}` : PROJECT_DIR
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
    APPROACHES, EXECUTION_TIMES_PATH, getActualImpactSetPath, getDetectedImpactSetPath, SPMF_PATH,
    TARMAQ_RESULT_PATH, TARMAQ_COMMAND, getImpactSetCSVs, getChangeSetPath,
    CLASP_COMMAND, getClaspResultPath, getClaspPatternPath,
    CMCLASP_COMMAND, getCMClaspResultPath, getCMClaspPatternPath,
    SPADE_COMMAND, getSPADEResultPath, getSPADEPatternPath
}