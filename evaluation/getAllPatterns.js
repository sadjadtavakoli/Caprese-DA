const constants = require('../constants.js');

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

runClaspNoItemConstraint()



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