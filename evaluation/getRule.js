const fs = require('fs');
const constants = require('../constants.js');
let method = process.argv[3]
let targetedFunctions = process.argv[2].split(',')
let result;
if (method == "TARMAQ") {
    result = filterTARMAQResult()
} else {
    result = filterBerkeResult()
}

console.log(JSON.stringify(result))

function filterBerkeResult() {
    let berkeRes = JSON.parse(fs.readFileSync(constants.Berke_RESULT_PATH));
    return berkeRes.filter(item => targetedFunctions.includes(item[0]))
}

function filterTARMAQResult() {
    let tarmRes = JSON.parse(fs.readFileSync(constants.TARMAQ_RESULT_PATH));
    return tarmRes.filter(item => targetedFunctions.includes(item['rule'].split(" => ")[1]))
}