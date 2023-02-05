const fs = require("fs")
const path = require("path")
const { getFullTable, executionTimeToLatex } = require("./jsonToLatexRow")
const { benchmarkList, EXECUTION_TIMES_PATH, APPROACHES } = require('../evaluationConstants')

if (process.argv[1].endsWith(path.basename(__filename))) {

    let executionTimes = JSON.parse(fs.readFileSync(EXECUTION_TIMES_PATH));
    let executionTimeResult = {}
    benchmarkList.forEach(filename => {
            executionTimes[filename][APPROACHES.caprese]['average'] = (executionTimes[filename][APPROACHES.caprese]['average'] / 1000).toFixed(2)
            executionTimes[filename][APPROACHES.tarmaq]['average'] = (executionTimes[filename][APPROACHES.tarmaq]['average'] / 1000).toFixed(2)
            executionTimes[filename]["FP"]['average'] = (executionTimes[filename]["FP"]['average'] / 1000).toFixed(2)
            executionTimes[filename]["DA"]['average'] = (executionTimes[filename]["DA"]['all'] / 1000).toFixed(2)
            executionTimeResult[filename] = executionTimeToLatex(executionTimes[filename])
    });
    
    console.log(getFullTable(executionTimeResult))
}