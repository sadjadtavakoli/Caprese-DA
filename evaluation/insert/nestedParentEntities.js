// !!!!! DEPRECATED 
// DOESN'T FOLLOW THE LATEST EVALUATION SETUP

const fs = require("fs")
const { benchmarkList, getActualImpactSetPath, getOriginalImpactSetPath } = require('../evaluationConstants')

benchmarkList.forEach(filename => {
    insertNestedParentEntities(filename)
})

function insertNestedParentEntities(filename) {
    let actualImpactSets = JSON.parse(fs.readFileSync(getActualImpactSetPath(filename)));
    let detectedImpactSet = JSON.parse(fs.readFileSync(getOriginalImpactSetPath(filename)));

    for (let commit in detectedImpactSet) {
        for (let approach of Object.keys(detectedImpactSet[commit])) {
            let impactset = detectedImpactSet[commit][approach]
            let actualImpactSet = actualImpactSets[commit]
            let groundTruth = actualImpactSet['impacted']
            let changeSet = actualImpactSet['changes']

            for (let entityInfo of impactset) {
                let entity = entityInfo['consequent']
                let entitySecs = entity.split("-")
                for (let change of changeSet) {
                    if (areNested(entity, change)) {
                        if (entitySecs.length == 1) {
                            entitySecs = convertToFunc(entitySecs)
                        }
                        if (!includes(groundTruth, entitySecs)) {
                            groundTruth.push(entitySecs)
                        }
                    }
                }
            }

        }
    }
    fs.writeFileSync(getActualImpactSetPath(filename), JSON.stringify(actualImpactSets));
}

function areNested(item1, item2) {
    let item1_info = getIndo(item1)
    let item2_info = getIndo(item2)

    if (item1_info['path'] == item2_info['path']) {
        let item2_is_nested = item1_info.first_line <= item2_info.first_line && (!item1_info.last_line || item1_info.last_line >= item2_info.last_line)
        let item1_is_nested = item2_info.first_line <= item1_info.first_line && (!item2_info.last_line || item2_info.last_line >= item1_info.last_line)
        return item2_is_nested || item1_is_nested
    }
    return false

    function getIndo(item) {
        let secs = item.split('-')
        if (secs.length == 1) {
            secs = convertToFunc(secs)
        }
        return { name: secs[0], path: secs[1], first_line: parseInt(secs[secs.length - 2]), last_line: parseInt(secs[secs.length - 1]) }
    }
}

function includes(arr, newItem) {
    return arr.some(item => item[0] == newItem[0] && item[1] == newItem[1] && item[2] == newItem[2] && item[3] == newItem[3])
}

function convertToFunc(entitySecs) {
    entitySecs[1] = entitySecs[0]
    entitySecs[2] = 1
    entitySecs[3] = null
    return entitySecs
}