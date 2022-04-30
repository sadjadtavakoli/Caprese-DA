const path = require('path');
const fs = require('fs');
const constants = require('./constants.js');
function cleanup() {
    console.log(" = = = = cleanup = = = = = ")
    clearFile(constants.SEQUENCES_PATH)
    clearFile(constants.SEQUENCES_PATH+"details.txt")
    clearFile(constants.REMOVED_PATH)
    clearFile(constants.PATTERNS_PATH)
    clearFile(constants.MAPPINGS_PATH)
    clearFile(constants.DA_CALL_SEQUENCE_PATH)
    clearFile(constants.CURRENT_CHANGES_PATH)
    clearFile(constants.Berke_RESULT_PATH)

    fs.writeFileSync(constants.SEQUENCES_PATH, "")
    fs.writeFileSync(constants.SEQUENCES_PATH+"details.txt", "")
    fs.writeFileSync(constants.REMOVED_PATH, "")
    fs.writeFileSync(constants.PATTERNS_PATH, "")
    fs.writeFileSync(constants.MAPPINGS_PATH, "{}")
    fs.writeFileSync(constants.DA_DEPENDENCIES_PATH, "{}")
    fs.writeFileSync(constants.CURRENT_CHANGES_PATH, "")
    fs.writeFileSync(constants.Berke_RESULT_PATH, "")
}

function clearFile(filePath){
    if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath)
    }
}

cleanup()
