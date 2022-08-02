import Mocha from 'mocha';
import { createRequire } from 'module';
import glob from 'glob'

const require = createRequire(import.meta.url)
const constants = require("../constants");
const fs = require("fs"),
    path = require("path");


let mochaAsync = new Mocha();
let mocha = new Mocha();
mocha.reporter('./reporter') // path to custom reporter
mochaAsync.reporter('./reporter') // path to custom reporter

async function sh(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, {maxBuffer: 1024 * 1000}, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

(async function run() {  
    let testDir = constants.REPO_PATH + path.sep + constants.REPO_TEST_RELATIVE_DIR
    const testsRegex = `${testDir}/**/*(*.cjs|*.js)`
    glob(testsRegex, async function(err, files) {
      // Add each .js file to the mocha instance
      await Promise.all(files.map(async (file) => {
        const {stdout, stderr} = await sh(`head -n 10 ${file}`);        
        if(stdout.includes("import") && stdout.includes("require")){  
        } else if(stdout.includes("import")){
            mochaAsync.addFile(file)
        } else if (stdout.includes("require")){
            mocha.addFile(file)
        } else {
            console.log("ridi", file)
        }
      }))  
    
      console.log("running mochaAsync")
      // await mochaAsync.loadFilesAsync()
      // mochaAsync.run(function (failures) {
      //   process.exitCode = failures ? 1 : 0 // exit with non-zero status if there were failures
      // })
      
      mochaAsync.loadFilesAsync().then(()=>{
        mochaAsync.run((failures)=>{
          process.exitCode = failures ? 1 : 0
        })
      }).then(()=>{
        console.log("running mocha")
        mocha.run()
      }).catch(console.error);
      

    });
  })().catch(console.error)