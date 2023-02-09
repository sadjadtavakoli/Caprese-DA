const fs = require('fs');
const path = require('path')
const { ALL_IMPACTED_ENTITIES_CSV, CHANGE_SET_PATH, getActualImpactSetPath } = require('../evaluationConstants')

if (process.argv[1].endsWith(path.basename(__filename))) {

    readChangeSets()
}

function readChangeSets() {
    let impactSetCSV = fs.readFileSync(ALL_IMPACTED_ENTITIES_CSV).toString();
    let changeSets = JSON.parse(fs.readFileSync(CHANGE_SET_PATH).toString());
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
        let impact1 = cells.splice(1, 3)
        let impact2 = cells.splice(1, 3)
        addImpacted(impact1, changedEntity)
        addImpacted(impact2, changedEntity)
    }

    insertImpactedEntities()
    fs.writeFileSync(getActualImpactSetPath(), JSON.stringify(changeSets))

    function addImpacted(impactedEntity, changedEntity) {
        if (impactedEntity[1] != "") {
            impactedEntity[2] = parseInt(impactedEntity[2])
            if (impactedEntity[0] == "0") {
                impactedEntity[0] = "arrowAnonymousFunction"
            } else if (impactedEntity[0] == "1") {
                impactedEntity[0] = impactedEntity[1]
            }

            impactSetList[changedEntity].push(impactedEntity)
        }
    }

    function insertImpactedEntities() {
        for (let commit in changeSets) {
            let changes = changeSets[commit]['changes']
            let allImpactedEntities = []

            for (let change of changes) {
                let impactSet = impactSetList[change]
                allImpactedEntities = allImpactedEntities.concat(impactSet)
            }

            changeSets[commit]['impacted'] = allImpactedEntities
        }
    }
}
