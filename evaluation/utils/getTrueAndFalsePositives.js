const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`
const { STATUS } = require("../evaluation.js")
const capreseName = "berke"

if (process.argv[2]) {
    getData(process.argv[2])
} else {
    let projects_list = ["eslint-plugin-react", "ws", "cla-assistant", "grant", "markdown-it", "environment", "nodejs-cloudant", "assemble", "express", "session", "jhipster-uml", "neo-async"]

    projects_list.forEach(filename => {
        getData(filename)
    });
}

function getData(filename) {
    let result = JSON.parse(fs.readFileSync(`${resultDirPath}${filename}${path.sep}results.json`));
    fs.writeFileSync(`${resultDirPath}${filename}${path.sep}True Positivs.json`, JSON.stringify(getPositives(result, 'true')));
    fs.writeFileSync(`${resultDirPath}${filename}${path.sep}False Positivs.json`, JSON.stringify(getPositives(result, 'false')));
}

function getPositives(evaluationResult, type) {
    let result = {};
    for (let commit in evaluationResult) {
        let impactSet = evaluationResult[commit][capreseName]
        let items = []
        let changeSet = evaluationResult[commit]['commits']
        let changeSetID = {}
        for(let consequentInfo of impactSet){
            if (consequentInfo["FP-evaluation"] != undefined) {
                for(let entecedent of consequentInfo["FP-antecedents"]){
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
            if (consequentInfo["FP-evaluation"] != undefined && consequentInfo["FP-evaluation"].toLowerCase().includes(type)) {
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
                items.push(consequentKey)
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