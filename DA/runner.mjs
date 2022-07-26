import Mocha from 'mocha';
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const constants = require("../constants");
const fs = require("fs"),
    path = require("path");


let mocha = new Mocha();
mocha.reporter('./reporter') // path to custom reporter

for(let dir of constants.REPO_TEST_RELATIVE_DIR){
    let testDir = constants.REPO_PATH + path.sep + dir
    // read all files in the `test` directory ending with `.js` and `.mjs` extension
    addFiles(testDir);
}

mocha.run();

function addFiles(dirPath) {
    fs.readdirSync(dirPath).forEach(filename => {
        if (fs.statSync(dirPath + path.sep + filename).isDirectory()) {
            addFiles(dirPath + path.sep + filename)
        } else if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
            mocha.addFile(path.join(dirPath, filename));
        }
    });
}