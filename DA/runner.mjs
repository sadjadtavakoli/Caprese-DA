import { createRequire } from 'module';
const require = createRequire(import.meta.url)
const Mocha = require('mocha');
const constants = require("../constants");
const fs = require("fs"),
    path = require("path");


let mocha = new Mocha();
mocha.reporter('./reporter.js') // path to custom reporter
mocha.timeout("10000")

let testDir = constants.REPO_PATH + path.sep + constants.REPO_TEST_RELATIVE_DIR
addFiles(testDir);

mocha.loadFilesAsync().then(()=>{
  mocha.run((failures)=>{
    process.exitCode = failures ? 1 : 0
  })
}).catch(console.error);

function addFiles(dirPath) {
  fs.readdirSync(dirPath).forEach(filename => {
    if (fs.statSync(dirPath + path.sep + filename).isDirectory() && filename!="fixtures") {
      addFiles(dirPath + path.sep + filename)
    } else if (filename.endsWith('.js') || filename.endsWith('.cjs') || filename.endsWith('.ts')) {
      console.log(filename);  
      mocha.addFile(path.join(dirPath, filename));
      }
  });
}