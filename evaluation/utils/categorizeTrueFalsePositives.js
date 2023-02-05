const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { benchmarkList } = require('../projects_confiqs')

if (process.argv[2]) {
    getData(process.argv[2])
} else {
    getData(benchmarkList, "True Positives")
}

function getData(projects_list, type) {

    let total = {}
    projects_list.forEach(filename => {
        let result = JSON.parse(fs.readFileSync(`${resultDirPath}${filename}${path.sep}${type}.json`));
        type.toLowerCase()
        let projectData = getPositives(result, type.toLowerCase());
        for(let key in projectData){
            if(total[key]!=undefined){
                total[key]+=projectData[key]
            }else{
                total[key] = projectData[key]
            }
        }
        console.log(filename)
        console.log(projectData)
    });
    console.log(total)
}

function getPositives(evaluationResult, type) {
    let result = {};

    for (let commit in evaluationResult) {
        let impactSet = evaluationResult[commit][type]
        for(let consequentInfo in impactSet){
            let reasons = impactSet[consequentInfo].split(" | ")
            for(let reason of reasons){
                if(result[reason]!=undefined){
                    result[reason]+=1;
                }else{
                    result[reason] = 1;
                }
            }
        }
    }
return result
}