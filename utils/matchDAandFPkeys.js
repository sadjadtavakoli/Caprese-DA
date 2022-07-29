const fs = require('fs')
const constant = require('../constants.js')
// const DA_DEPENDENCIES_PATH = "./data/session/dependencies.json"
const DA_DEPENDENCIES_PATH = constant.DA_DEPENDENCIES_PATH
// const SEQUENCES_PATH = "./data/session/sequences.txt"
const SEQUENCES_PATH = constant.SEQUENCES_PATH
const resultPath = "./matching.json"

function matchDAandFP() {

    let daDependencies = JSON.parse(fs.readFileSync(DA_DEPENDENCIES_PATH))

    let keyMap = daDependencies['keyMap']
    delete daDependencies['keyMap']
    let DAvalues = new Set()
    for (let key in keyMap) {
        DAvalues.add(keyMap[key])
    }
    for (let key in daDependencies) {
        DAvalues.add(key)
    }

    DAvalues = [...DAvalues];
    DAvalues = DAvalues.map(value => value.split("-"))

    let sequences = fs.readFileSync(SEQUENCES_PATH).toString().trim().split("\n");
    let removed = fs.readFileSync(constant.REMOVED_PATH).toString().trim().split(", ");
    let FPvalues = new Set()
    sequences.forEach(sequence => {
        let commitChanges = sequence.slice(0, -4).split(" ")
        commitChanges = commitChanges.filter(item => !removed.includes(item))
        commitChanges.forEach(change => FPvalues.add(change.split("-")))
    })

    let functionsMatching = new Map()
    FPvalues = [...FPvalues].filter(item => !item[0].endsWith(".js"))

    FPvalues.forEach(functionInfo => {
        let fileName = functionInfo[1]
        if (fileName != undefined) {
            let matchedDA = DAvalues.filter(value => value[1] == fileName)
            functionsMatching.set(functionInfo, [])
            matchedDA.forEach(matched => {
                let firtFunc = parseInt(functionInfo[2])
                let endFunc = parseInt(functionInfo[3])
                let firstMatched = parseInt(matched[2])
                let endMatched = parseInt(matched[3])
                if ((firtFunc <= firstMatched && endFunc >= endMatched) || (firstMatched <= firtFunc && endMatched >= endFunc)) {
                    functionsMatching.get(functionInfo).push(matched)
                    if (firtFunc == firstMatched && endFunc == endMatched) {
                        functionsMatching.get(functionInfo).push("MATCHED")
                    }
                }
            })
        }
    })
    for (let key of functionsMatching.keys()) {
        if (functionsMatching.get(key).includes("MATCHED")) {
            functionsMatching.delete(key)
        }
    }

    fs.writeFileSync(resultPath, JSON.stringify(Object.fromEntries(functionsMatching)))
}

function mappingUniqueKeyChecking() {
    let daDependencies = JSON.parse(fs.readFileSync(constant.MAPPINGS_PATH))
    let removed = fs.readFileSync(constant.REMOVED_PATH).toString().trim().split(", ");

    let DAvalues = new Set()
    for (let key in daDependencies) {
        DAvalues.add(daDependencies[key])
    }

    let FPvalues = new Set()
    for (let key in daDependencies) {
        FPvalues.add(key)
    }

    DAvalues = [...DAvalues].filter(element => FPvalues.has(element) && !removed.includes(element))
    for (let element of DAvalues) {
        if (daDependencies[element] != element) {
            console.log(element)
        }
    }
}

function historyMappingUniqueKeyChecking() {
    let data = JSON.parse(fs.readFileSync("./refdiff/refdiff-berkak/historyMapping.json"))
    for (var commit in data) {
        let daDependencies = data[commit]

        let DAvalues = new Set()
        for (let key in daDependencies) {
            DAvalues.add(daDependencies[key])
        }

        let FPvalues = new Set()
        for (let key in daDependencies) {
            FPvalues.add(key)
        }
        DAvalues = [...DAvalues].filter(element => FPvalues.has(element))
        let prints = false
        for (let element of DAvalues) {
            if (daDependencies[element] != element) {
                console.log(element)
                console.log(daDependencies[element])
                console.log(daDependencies[daDependencies[element]])
                console.log(" . . . . ")
                prints = true
            }
        }
        if (prints) {
            console.log(commit)
            console.log(" = = = = = = ")
        }
    }
}