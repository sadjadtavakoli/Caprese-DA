const fs = require('fs');
const constants = require('../constants.js');

function compareResults() {

    let tarmaq = JSON.parse(fs.readFileSync(constants.TARMAQ_RESULT_PATH))
    let berkeResult = JSON.parse(fs.readFileSync(constants.Berke_RESULT_PATH))
    let tarmaqAntecedents = []
    let berkeAntecedents = []
    let result = {}
    for (let rule of tarmaq) {
        tarmaqAntecedents.push(rule['rule'].split(" => ")[1])
    }
    for (let rule of berkeResult) {
        berkeAntecedents.push(rule[0])
    }
    let removed = fs.readFileSync(constants.REMOVED_PATH).toString().split(", ");

    result["tarmaq uniques"] = tarmaqAntecedents.filter(x => berkeAntecedents.indexOf(x) === -1).filter(x => removed.indexOf(x) === -1).toString()
    result["berke uniques"] = berkeAntecedents.filter(x => tarmaqAntecedents.indexOf(x) === -1).toString()
    return result
}

module.exports = {compareResults}

if(process.argv[1]){
    console.log(compareResults())
}