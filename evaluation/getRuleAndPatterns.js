const fs = require('fs');
const constants = require('../constants.js');

function getRules() {
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
}

function getAllPattern() {
    function runClaspNoItemConstraint() {
        console.log(" = = = Run Clasp No Item Constraints = = = ")
        return new Promise(function (resolve, reject) {
            exec(constants.CLASP_COMMAND + `"${constants.SEQUENCES_PATH} ${constants.EXPERIMENTAL_PATTERNS_PATH} -"`, (err, stdout, stderr) => {
                if (!err) {
                    resolve()
                }
                else {
                    reject(err)
                }
            })
        })
    }

    function sortPatterns() {
        let patterns = fs.readFileSync(constants.EXPERIMENTAL_PATTERNS_PATH).toString();
        patterns = patterns.split(",");
        let sortableImpactSet = [];
        for (let pattern of patterns) {
            let sequence = pattern.split(" -1:")[0];
            if (sequence.split(" ").length == 1) {
                continue;
            }
            let probability = pattern.split(" -1:")[1];
            sortableImpactSet.push([sequence, probability])
        }

        sortableImpactSet.sort(function (a, b) {
            return b[1] - a[1];
        });

        fs.writeFileSync(constants.EXPERIMENTAL_PATTERNS_PATH, JSON.stringify(sortableImpactSet))
    }

}