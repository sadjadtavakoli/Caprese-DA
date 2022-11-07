const fs = require("fs")
const path = require("path")
const { EXECUTION_TIMES_PATH } = require('./evaluationExecutionTime')
const { getFullTable, executionTimeToLatex } = require("./jsonToLatexRow")

if (process.argv[1].endsWith(path.basename(__filename))) {

    let projects_list = ["eslint-plugin-react", "ws", "cla-assistant", "grant", "markdown-it", "environment", "nodejs-cloudant", "assemble", "express", "session", "jhipster-uml", "neo-async"]
    let executionTimes = JSON.parse(fs.readFileSync(EXECUTION_TIMES_PATH));
    let executionTimeResult = {}
    projects_list.forEach(filename => {
            executionTimes[filename]["berke"]['average'] = (executionTimes[filename]["berke"]['average'] / 1000).toFixed(2)
            executionTimes[filename]["tarmaq"]['average'] = (executionTimes[filename]["tarmaq"]['average'] / 1000).toFixed(2)
            executionTimes[filename]["FP"]['average'] = (executionTimes[filename]["FP"]['average'] / 1000).toFixed(2)
            executionTimes[filename]["DA"]['average'] = (executionTimes[filename]["DA"]['all'] / 1000).toFixed(2)
            executionTimeResult[filename] = executionTimeToLatex(executionTimes[filename])
    });
    
    console.log(getFullTable(executionTimeResult))
}