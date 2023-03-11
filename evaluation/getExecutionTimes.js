const fs = require("fs")
const path = require("path")
const { benchmarkList, EXECUTION_TIMES_PATH } = require('./evaluationConstants')

if (process.argv[1].endsWith(path.basename(__filename))) {

    let executionTimes = JSON.parse(fs.readFileSync(EXECUTION_TIMES_PATH));
    let caprese = []
    let tarmaq = []
    let FPD = []
    let DAAverage = []
    let DATest = []
    let DAOverHead = []
    benchmarkList.forEach(filename => {
        caprese.push(toFixed2(executionTimes[filename]["caprese"]['average']))
        tarmaq.push(toFixed2(executionTimes[filename]["tarmaq"]['average']))
        FPD.push(toFixed2(executionTimes[filename]["FPD"]['average']))
        DAAverage.push(toFixed2(executionTimes[filename]["DA"]['all']))
        DATest.push(toFixed2(executionTimes[filename]["DA"]['test']))
        DAOverHead.push(toFixed2(executionTimes[filename]["DA"]['all'] - executionTimes[filename]["DA"]['test']))
    });

    function toFixed2(number) {
        if (parseInt(number)) {
            return (number / 1000).toFixed(2)
        }
        return "-"
    }
    let result = {
        "caprese": average(caprese),
        "tarmaq": average(tarmaq),
        "FPD": average(FPD),
        "DA": average(DAAverage),
        "DA test": average(DATest),
        "DA overhead": average(DAOverHead)
    }

    function average(array) {
        array = array.filter(item => item != "-")
        array = array.map(item => parseFloat(item))
        return parseFloat((array.reduce((a, b) => a + b) / array.length).toFixed(2))
    }
    console.log(result)
}