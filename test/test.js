const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
var assert = require('assert');

describe('Test callChain.js', () => runTest('callChain.js'));
describe('Test callbackSingleKnownFunction.js', () => runTest('callbackSingleKnownFunction.js'));
describe('Test callbackSingleUnknownFunction.js', () => runTest('callbackSingleUnknownFunction.js'));
describe('Test callbackUnknownChain.js', () => runTest('callbackUnknownChain.js'));
describe('Test timeoutFakeKnownFunction.js', () => runTest('timeoutFakeKnownFunction.js'));
describe('Test timeoutMultipleNestedTimeouts.js', () => runTest('timeoutMultipleNestedTimeouts.js'));
describe('Test timeoutMultipleTimeouts.js', () => runTest('timeoutMultipleTimeouts.js'));
describe('Test timeoutSingleKnownFunction.js', () => runTest('timeoutSingleKnownFunction.js'));
describe('Test timeoutSingleUnknownFunction.js', () => runTest('timeoutSingleUnknownFunction.js'));


const nodeprofCommand = '$GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis analyser.js test/unit_tests/'

function runTest(item) {
  it('Run nodeprof', function (done) {
    this.timeout(10000);
    execute(nodeprofCommand + item, done)
    // done()
  });
  it('Compare resutl', function (done) {
    let diffs = compairResult(item);
    if(diffs.length > 0){
      assert.fail(JSON.stringify(diffs,null,'\t'));
    }
    done();
  });
}
function execute(command, done) {
  exec(command, (err, stdout, stderr) => {
    process.stdout.write(stdout)
    done()
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