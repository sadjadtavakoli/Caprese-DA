const path = require('path');
const fs = require('fs');
const constants = require('./constants.js');

function cleanup() {
    if (!fs.existsSync(constants.DATA_PATH)) {
        fs.mkdirSync(constants.DATA_PATH);
    }
    console.log(" = = = = cleanup = = = = = ")
    clearFile(constants.Berke_RESULT_PATH)
    clearFile(constants.DA_DEPENDENCIES_PATH)

    fs.writeFileSync(constants.DA_DEPENDENCIES_PATH, "{}")
    fs.writeFileSync(constants.Berke_RESULT_PATH, "")
}

function clearFile(filePath){
    if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath)
    }
}

cleanup()
