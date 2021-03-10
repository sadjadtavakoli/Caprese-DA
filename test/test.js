const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
var assert = require('assert');

// const directoryPath = path.join(__dirname, 'inputs');
// var myArgs = process.argv.slice(2)

// let files = []
// if (myArgs.length > 0) {
//   files = myArgs
// }
// else {
//   fs.readdir(directoryPath, function (err, all_tests) {
//     files = all_tests
//   });
// }

// describe('Test simpleTrace.js', () => runTest('simpleTrace.js'))
// describe('Test callbackChainDifferentCalls.js', () => runTest('callbackChainDifferentCalls.js'))
describe('Test callbackKnownFunction.js', () => runTest('callbackKnownFunction.js'))
describe('Test timeoutKnownFunction.js', () => runTest('timeoutKnownFunction.js'))
describe('Test faketimeoutKnownFunction.js', () => runTest('faketimeoutKnownFunction.js'))

const nodeprofCommand = '$GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis analyser.js test/inputs/'

function runTest(item) {
  it('Run nodeprof', function (done) {
    this.timeout(10000);
    execute(nodeprofCommand + item)
    done()
  });
  it('Compare resutl', function (done) {
    let diffs = compairResult(item);
    if(diffs.length > 0){
      assert.fail(JSON.stringify(diffs,null,'\t'));
    }
    done();
  });
}
function execute(command) {
  exec(command, (err, stdout, stderr) => {
    process.stdout.write(stdout)
  })
}

function compairResult(fileName) {
  let expectedOutput = fs.readFileSync(path.join(__dirname, 'expectedOutputs' + path.sep + fileName), { encoding: 'utf8' }).split('\n')
  let analyzerOutput = fs.readFileSync(path.join(__dirname, 'analyzerOutputs' + path.sep + fileName), { encoding: 'utf8' }).split('\n')
  let min_content = expectedOutput
  let max_content = 'expected output'

  if (analyzerOutput.length < expectedOutput.length) {
    min_content = analyzerOutput
    max_content = 'analyzer result'
  }
  let diffs = []
  for (let i in min_content) {
    if(expectedOutput[i] !== analyzerOutput[i]){
      diffs.push({
        'line_number' : i,
        'expected' : expectedOutput[i],
        'actual' : analyzerOutput[i]
      })
    }
  }
  if (analyzerOutput.length !== expectedOutput.length) {
    diffs.push(max_content + ' has some extra lines!')
  }
return diffs
}