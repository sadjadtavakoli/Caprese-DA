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

describe('Test simpleTrace.js', () => runTest('simpleTrace.js'))

function runTest(item) {
  const nodeprofCommand = '$GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis analyser.js inputs/'
  it('Run nodeprof', function (done) {
    execute(nodeprofCommand + item)
    done();
  });
  it('Compare resutl', function (done) {
    compairResult(item)
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

  for (let i in min_content) {
    assert.deepStrictEqual(expectedOutput[i], analyzerOutput[i], 'a difference in line ' + i)
    if (analyzerOutput.length !== expectedOutput.length) {
      assert.fail(max_content + ' has some extra lines!')

    }

  }
}