import { createRequire } from 'module';
const require = createRequire(import.meta.url)
const Mocha = require('mocha');
const constants = require("./constants");
const fs = require("fs"),
    path = require("path");


let mocha = new Mocha();
mocha.reporter('./reporter.js') // path to custom reporter
mocha.timeout("10000")

let testDir = constants.REPO_PATH + path.sep + constants.REPO_TEST_RELATIVE_DIR

let excludedFiles = constants.REPO_TEST_EXCLUDED_DIRS
excludedFiles = excludedFiles.map(filePath => testDir + path.sep + filePath)

addFiles(testDir);

mocha.loadFilesAsync().then(() => {
    mocha.run((failures) => {
        process.exitCode = failures ? 1 : 0
    })
}).catch(console.error);


function addFiles(dirPath) {
    if (fs.statSync(dirPath).isDirectory() && !excludedFiles.includes(dirPath)) {
        fs.readdirSync(dirPath).forEach(filename => {
            let filePath = dirPath + path.sep + filename;
            addFiles(filePath)
        });
    } else if (dirPath.endsWith('.js') || dirPath.endsWith('.cjs')) {
        console.log(dirPath);
        mocha.addFile(dirPath);
    }
}