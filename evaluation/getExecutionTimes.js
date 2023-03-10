const fs = require("fs")
const path = require("path")
const { getFullTable, executionTimeToLatex } = require("./utils")
const { benchmarkList, EXECUTION_TIMES_PATH } = require('./evaluationConstants')

if (process.argv[1].endsWith(path.basename(__filename))) {

    let executionTimes = JSON.parse(fs.readFileSync(EXECUTION_TIMES_PATH));
    let executionTimeResult = {}
    benchmarkList.forEach(filename => {
        executionTimes[filename]["caprese"]['average'] = toFixed2(executionTimes[filename]["caprese"]['average'])
        executionTimes[filename]["tarmaq"]['average'] = toFixed2(executionTimes[filename]["tarmaq"]['average'])
        executionTimes[filename]["FP"]['average'] = toFixed2(executionTimes[filename]["FP"]['average'])
        executionTimes[filename]["DA"]['average'] = toFixed2(executionTimes[filename]["DA"]['all'])
        executionTimes[filename]["DA"]['original'] = toFixed2(executionTimes[filename]["DA"]['original'])
        executionTimes[filename]["DA"]['overHead'] = executionTimes[filename]["DA"]['average'] - executionTimes[filename]["DA"]['original']
        executionTimeResult[filename] = executionTimeToLatex(executionTimes[filename])
    });

    function toFixed2(number) {
        if (parseInt(number)) {
            return (number / 1000).toFixed(2)
        }
        return number
    }
    console.log(getFullTable(executionTimeResult))
}