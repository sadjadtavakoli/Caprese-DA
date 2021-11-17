const path = require('path');
const fs = require('fs');
const constants = require('./constants.js');
function cleanup() {
    fs.unlinkSync(constants.SEQUENCES_PATH)
    fs.unlinkSync(constants.REMOVED_PATH)
    fs.unlinkSync(constants.PATTERNS_PATH)
    fs.unlinkSync(constants.MAPPINGS_PATH)
    fs.unlinkSync(constants.DA_DEPENDENCIES_PATH)
    fs.unlinkSync(constants.DA_CALL_SEQUENCE_PATH)
    fs.unlinkSync(constants.CURRENT_CHANGES_PATH)

    fs.writeFileSync(constants.SEQUENCES_PATH, "")
    fs.writeFileSync(constants.REMOVED_PATH, "")
    fs.writeFileSync(constants.PATTERNS_PATH, "")
    fs.writeFileSync(constants.MAPPINGS_PATH, "{}")
    fs.writeFileSync(constants.DA_DEPENDENCIES_PATH, "")
    fs.writeFileSync(constants.DA_CALL_SEQUENCE_PATH, "")
    fs.writeFileSync(constants.CURRENT_CHANGES_PATH, "")
}

cleanup()
