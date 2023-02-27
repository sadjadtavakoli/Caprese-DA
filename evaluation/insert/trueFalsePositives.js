const fs = require("fs")
const { benchmarkList, getActualImpactSetPath, getDetectedImpactSetPath, getOriginalImpactSetPath, STATUS } = require('../evaluationConstants')

benchmarkList.forEach(filename => {
    console.log(filename)
    computeTruePositives(filename)
})

function computeTruePositives(filename) {
    let actualImpactSets = JSON.parse(fs.readFileSync(getActualImpactSetPath(filename)));
    let detectedImpactSets = JSON.parse(fs.readFileSync(getOriginalImpactSetPath(filename)));

    for (let commit in detectedImpactSets) {
        for (let approach of Object.keys(detectedImpactSets[commit])) {
            let detectedImpactSet = getApproachResult(detectedImpactSets[commit], approach)
            let actualImpactSet = actualImpactSets[commit]
            let groundTruth = actualImpactSet['impacted']

            for (let entityInfo of detectedImpactSet) {
                if (entityInfo['status'] != STATUS.removed) {
                    let entity = entityInfo['consequent']
                    let entitySecs = entity.split("-")
                    if (!parseInt(entitySecs[entitySecs.length - 1])) {
                        entityInfo['evaluation'] = matchFile(entity, groundTruth)
                        console.log("file", entity)
                    } else if ((entitySecs[0] == entitySecs[1] && entitySecs[2] == 1)) {
                        console.log("unusual file!")
                        entityInfo['evaluation'] = matchFile(entitySecs[0], groundTruth)
                    } else {
                        entityInfo['evaluation'] = matchNonFiles(entitySecs, groundTruth)

                    }
                }
            }
        }
    }

    fs.writeFileSync(getDetectedImpactSetPath(filename), JSON.stringify(detectedImpactSets));


    function matchNonFiles(entitySecs, groundTruth) {

        let enFilePath = entitySecs.slice().splice(1, entitySecs.length - 3).join("-")
        let enFirstLine = entitySecs[entitySecs.length - 2]
        let enLastLine = entitySecs[entitySecs.length - 1]
        let samefile = groundTruth.filter(item => item[1] == enFilePath)
        let result = "FP"
        if (samefile.length == 0 && groundTruth.some(item => {
            enFilePath.includes(item[1]) || (item[1].includes(enFilePath))
        })) {
            result += ` - SUSPICIOUS PATH`
        }


        for (let groundTruthEntity of samefile) {
            if (enFirstLine == groundTruthEntity[2]) {
                if (enLastLine == groundTruthEntity[3]) {
                    return "TP"

                } else {
                    result += ` - RMV different last line ${groundTruthEntity[0]} - ${groundTruthEntity[2]} - ${groundTruthEntity[3]}`
                }
            }
        }

        for (let groundTruthEntity of samefile) {

            if (areNested(groundTruthEntity.join("-"), entitySecs.join("-"))) {
                result += ` - INDIRECT ${groundTruthEntity[0]} - ${groundTruthEntity[2]} - ${groundTruthEntity[3]}`
            }
        }
        return result
    }

    function matchFile(filePath, groundTruth) {
        let result = "FP"

        let groundTruthFiles = groundTruth.filter(item => item[0] == item[1])

        for (let groundTruthEntity of groundTruthFiles) {

            if (filePath == groundTruthEntity[1]) {

                return "TP"

            } else if (filePath.includes(groundTruthEntity[1]) || (groundTruthEntity[1].includes(filePath))) {

                result += ` - SUSPICIOUS PATH FOR FILE ${groundTruthEntity[1]}`

            }
        }

        if (groundTruth.some(item => item[1] == filePath)) {

            result += ` - INDIRECT ${groundTruth.filter(item => item[1] == filePath).length}`

        }

        return result
    }
}

function getApproachResult(commitResult, approach) {
    return commitResult[approach]
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
        let enFilePath = secs.slice().splice(1, secs.length - 3).join("-")
        return { name: secs[0], path: enFilePath, first_line: parseInt(secs[secs.length - 2]), last_line: parseInt(secs[secs.length - 1]) }
    }
}