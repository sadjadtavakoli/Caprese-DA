const fs = require("fs")
const { benchmarkList, getActualImpactSetPath, getOriginalImpactSetPath } = require('../evaluationConstants')

benchmarkList.forEach(filename => {
    console.log(filename)
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
                        if (!parseInt(entitySecs[entitySecs.length - 1])) {
                            entitySecs = convertToFunc(entity)
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
    let item1_info = getInfo(item1)
    let item2_info = getInfo(item2)

    if (item1_info['path'] == item2_info['path']) {
        let item2_is_nested = item1_info.first_line <= item2_info.first_line && (!item1_info.last_line || item1_info.last_line >= item2_info.last_line)
        let item1_is_nested = item2_info.first_line <= item1_info.first_line && (!item2_info.last_line || item2_info.last_line >= item1_info.last_line)
        return item2_is_nested || item1_is_nested
    }
    return false

    function getInfo(item) {
        let secs = item.split('-')
        if (!parseInt(secs[secs.length - 1])) {
            secs = convertToFunc(item)
        }
        let filePath = secs.splice(1, secs.length - 3).join("-")
        return { name: secs[0], path: filePath, first_line: parseInt(secs[secs.length - 2]), last_line: parseInt(secs[secs.length - 1]) }
    }
}

function includes(arr, newItem) {
    let filePath = newItem.slice().splice(1, newItem.length - 3).join("-")
    return arr.some(item => item[0] == newItem[0] && item[1] == filePath && item[2] == newItem[2] && item[3] == newItem[3])
}

function convertToFunc(entity) {
    return [entity, entity, 1, null]
}