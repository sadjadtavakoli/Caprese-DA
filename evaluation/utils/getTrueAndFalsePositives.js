const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const capreseName = "berke"
const { benchmarkList } = require('../projects_confiqs')

const unit = "DA"

const evaluationKey = `${unit}-evaluation`
const antecedentsKey = `${unit}-antecedents`
const otherUnitsEvaluationKey = "FP-antecedents"

if(unit=="FP"){
    otherUnitsEvaluationKey = "DA-antecedents"    
}

if (process.argv[2]) {
    getData(process.argv[2])
} else {
    benchmarkList.forEach(filename => {
        getData(filename)
    });
}

function getData(filename) {
    let result = JSON.parse(fs.readFileSync(`${resultDirPath}${filename}${path.sep}results.json`));
    fs.writeFileSync(`${resultDirPath}${filename}${path.sep}${unit} True Positives.json`, JSON.stringify(getPositives(result, 'true')));
    fs.writeFileSync(`${resultDirPath}${filename}${path.sep}${unit} False Positives.json`, JSON.stringify(getPositives(result, 'false')));
}

function getPositives(evaluationResult, type) {
    let result = {};
    for (let commit in evaluationResult) {
        let impactSet = evaluationResult[commit][capreseName]
        let items = {}
        let changeSet = evaluationResult[commit]['commits']
        let changeSetID = {}
        for(let consequentInfo of impactSet){
            if (consequentInfo[evaluationKey] != undefined) {
                console.log(consequentInfo)
                for(let entecedent of consequentInfo[antecedentsKey]){
                    for(let func of entecedent){
                        let {consequentName, relationsInfo} = getFunctionRelations(func)
                        changeSetID[consequentName] = relationsInfo
                    }
                }
                if(Object.keys(changeSetID).length==changeSet.length){
                    break;
                }
            }
        }
        impactSet.forEach(consequentInfo => {
            if (consequentInfo[evaluationKey] != undefined && consequentInfo[evaluationKey].toLowerCase().includes(type)) {
                let {consequentName, relationsInfo} = getFunctionRelations(consequentInfo['consequent'])
                let isChild = false
                let isParent = false
                if(relationsInfo['parents']){
                    isChild = Object.values(changeSetID).some(fun=>relationsInfo['parents'].includes(fun['id']))
                }
                isParent = Object.values(changeSetID).some(fun=> fun['parents'] != undefined && fun['parents'].includes(relationsInfo['id']))

                let consequentKey = consequentName
                if(isParent || isChild){
                    consequentKey+= " =>"
                    if(isParent){
                        consequentKey+= "  PARENT"
                    }
                    if(isChild){
                        consequentKey+= "  CHILD"
                    }
                }
                if(consequentInfo[otherUnitsEvaluationKey]!=undefined){
                    consequentKey = "+ " + consequentKey
                }else{
                    consequentKey = "- " + consequentKey
                }
                items[consequentKey] = ""
            }
        })

        switch(type){
            case 'true':
                result[commit] = { 'changes': evaluationResult[commit]['commits'], 'true positives': items}
                break;
            case 'false':
                result[commit] = { 'changes': evaluationResult[commit]['commits'], 'false positives': items}
                break;
        }
    }
return result
}

function getFunctionRelations(key){
    let consequentSections = key.split(" | ")
    let consequentName = consequentSections[0]
    let relationsInfo = {}
    if(consequentSections[1]!=undefined){
        consequentSections[1] = consequentSections[1].replaceAll("-", ",")
        relationsInfo = JSON.parse(consequentSections[1])
    }
    return {consequentName, relationsInfo}
}