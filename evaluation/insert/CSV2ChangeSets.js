const fs = require('fs');
const path = require('path')
const { getImpactSetCSVs, getChangeSetPath, getActualImpactSetPath, benchmarkList } = require('../evaluationConstants')

if (process.argv[1].endsWith(path.basename(__filename))) {
    benchmarkList.forEach(benchmark => {
        console.log(filename)
        readCSVs(benchmark)
    })
}

function readCSVs(benchmark) {
    let impactSetCSV = fs.readFileSync(getImpactSetCSVs(benchmark)).toString();
    let changeSets = JSON.parse(fs.readFileSync(getChangeSetPath(benchmark)).toString());
    let lines = impactSetCSV.split('\n')
    lines.splice(0, 5)
    let changedEntity = lines[0].split(',')[0]
    let impactSetList = {}
    impactSetList[changedEntity] = []

    for (let line of lines) {
        let cells = line.split(',')
        if (cells[0] != "") {
            changedEntity = cells[0]
            impactSetList[changedEntity] = []
        }
        let impact1 = cells.splice(1, 4)
        let impact2 = cells.splice(1, 4)
        addImpacted(impact1, changedEntity)
        addImpacted(impact2, changedEntity)
    }

    fs.writeFileSync(getActualImpactSetPath(benchmark) + "pure list.json", JSON.stringify(impactSetList))
    insertImpactedEntities()
    fs.writeFileSync(getActualImpactSetPath(benchmark), JSON.stringify(changeSets))

    function addImpacted(impactedEntity, changedEntity) {
        if (impactedEntity[1] != "") {
            impactedEntity[3] = parseInt(impactedEntity[3])
            impactedEntity[2] = parseInt(impactedEntity[2])
            if (impactedEntity[0] == "0" || impactedEntity[0] == "") {
                impactedEntity[0] = "arrowAnonymousFunction"
            } else if (impactedEntity[0] == "1") {
                impactedEntity[0] = impactedEntity[1]
                impactedEntity[2] = 1
            }

            impactSetList[changedEntity].push(impactedEntity)
        }
    }

    function insertImpactedEntities() {
        for (let commit in changeSets) {
            let changes = changeSets[commit]['changes']
            changeSets[commit]['impacted'] = []
            console.log(commit)
            for (let change of changes) {
                let impactSet = impactSetList[change]
                if (impactSet == undefined) {
                    console.error("\nERROR!!!! \n impactSet is not detected for", change, "\nERRRRROOOORRRR!!!!\n")
                } else {
                    for (let impact of impactSet) {
                        if (!includes(changeSets[commit]['impacted'], impact)) {
                            changeSets[commit]['impacted'].push(impact)
                        }
                    }
                }
            }
        }
    }

    function includes(arr, newItem) {
        return arr.some(item => item[0] == newItem[0] && item[1] == newItem[1] && item[2] == newItem[2] && item[3] == newItem[3])
    }
}
