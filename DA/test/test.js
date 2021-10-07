const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
var assert = require('assert');

// describe('Test callChain.js', () => runTest('callChain.js'));
// describe('Test callbackAnonymousChain.js', () => runTest('callbackAnonymousChain.js'));
// describe('Test callbackChainDifferentCalls.js', () => runTest('callbackChainDifferentCalls.js'));
// describe('Test callbackChainForLoop.js', () => runTest('callbackChainForLoop.js'));
// describe('Test callbackNonBlockingFunctions.js', () => runTest('callbackNonBlockingFunctions.js'));
// describe('Test callbackSingleAnonymousFunction.js', () => runTest('callbackSingleAnonymousFunction.js'));
// describe('Test callbackSingleKnownFunction.js', () => runTest('callbackSingleKnownFunction.js'));
// describe('Test classInnerFunctionEvent.js', () => runTest('classInnerFunctionEvent.js'));
// describe('Test classInnerFunctionForEach.js', () => runTest('classInnerFunctionForEach.js'));
// describe('Test classInnerFunctionFunctionCall.js', () => runTest('classInnerFunctionFunctionCall.js'));
// describe('Test classInnerFunctionTimeout.js', () => runTest('classInnerFunctionTimeout.js'));
// describe('Test eventsAddAnonymousListenerDependency.js', () => runTest('eventsAddAnonymousListenerDependency.js'));
// describe('Test eventsAddKnownListenerDependency.js', () => runTest('eventsAddKnownListenerDependency.js'));
// describe('Test eventsAddListenerThenEmitDependency.js', () => runTest('eventsAddListenerThenEmitDependency.js'));
// describe('Test eventsAnonymousListener.js', () => runTest('eventsAnonymousListener.js'));
// describe('Test eventsCallThenAddListenerDependency.js', () => runTest('eventsCallThenAddListenerDependency.js'));
// describe('Test eventsDifferentEmitters.js', () => runTest('eventsDifferentEmitters.js'));
// describe('Test eventsMultipleListeners.js', () => runTest('eventsMultipleListeners.js'));
// describe('Test eventsNestedEmitterListeners.js', () => runTest('eventsNestedEmitterListeners.js'));
// describe('Test eventsOnceListener.js', () => runTest('eventsOnceListener.js'));
// describe('Test eventsPrependListener.js', () => runTest('eventsPrependListener.js'));
// describe('Test eventsPrependOnceListener.js', () => runTest('eventsPrependOnceListener.js'));
// describe('Test eventsSingleListener.js', () => runTest('eventsSingleListener.js'));
// describe('Test functionCallRequireModule.js', () => runTest('functionCallRequireModule.js'));
// describe('Test functionCall_1.js', () => runTest('functionCall_1.js'));
// describe('Test functionCall_2.js', () => runTest('functionCall_2.js'));
// describe('Test functionCall_3.js', () => runTest('functionCall_3.js'));
// describe('Test functionCall_4.js', () => runTest('functionCall_4.js'));
// describe('Test immediateAndTimeoutOrdering.js', () => runTest('immediateAndTimeoutOrdering.js'));
// describe('Test immediateMultipleImmediates.js', () => runTest('immediateMultipleImmediates.js'));
// describe('Test immediateSingleAnonymousFunction.js', () => runTest('immediateSingleAnonymousFunction.js'));
// describe('Test immediateSingleKnownFunction.js', () => runTest('immediateSingleKnownFunction.js'));
// describe('Test intervalSingleKnownFunction.js', () => runTest('intervalSingleKnownFunction.js'));
// describe('Test timeoutFakeKnownFunction.js', () => runTest('timeoutFakeKnownFunction.js'));
describe('Test timeoutMultipleNestedTimeouts.js', () => runTest('timeoutMultipleNestedTimeouts.js'));
// describe('Test timeoutMultipleTimeouts.js', () => runTest('timeoutMultipleTimeouts.js'));
// describe('Test timeoutSingleAnonymousFunction.js', () => runTest('timeoutSingleAnonymousFunction.js'));
// describe('Test timeoutSingleKnownFunction.js', () => runTest('timeoutSingleKnownFunction.js'));
// describe('Test timeoutZero.js', () => runTest('timeoutZero.js'));


const nodeprofCommand = '$GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis utils.js --analysis analyser.js test/unit_tests/'

function runTest(item) {
  it('Run nodeprof', function (done) {
    this.timeout(10000);
    execute(nodeprofCommand + item + " testMode", done)
  });
  it('Compare result', function (done) {
    let diffs = compairResult(item);
    if (diffs.length > 0) {
      assert.fail(JSON.stringify(diffs, null, '\t'));
    }
    done();
  });
  it('Compare traces', function (done) {
    compairTraces(item);
    done();
  });
  it('Compare dependencies', function (done) {
    compairDependencies(item);
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
    if (expectedOutput[i] !== analyzerOutput[i]) {
      diffs.push({
        'line_number': i,
        'expected': expectedOutput[i],
        'actual': analyzerOutput[i]
      })
    }
  }
  if (analyzerOutput.length !== expectedOutput.length) {
    diffs.push(max_content + ' has some extra lines!')
  }
  return diffs
}

function compairTraces(fileName) {
  let expectedOutput = fs.readFileSync(path.join(__dirname, 'expectedOutputs' + path.sep + 'traces' + path.sep + fileName), { encoding: 'utf8' }).split('\n')
  let analyzerOutput = fs.readFileSync(path.join(__dirname, 'analyzerOutputs' + path.sep + 'traces' + path.sep + fileName), { encoding: 'utf8' }).split('\n')
  assert.deepEqual(expectedOutput, analyzerOutput)
}

function compairDependencies(fileName) {
  let expectedOutput = JSON.parse(fs.readFileSync(path.join(__dirname, 'expectedOutputs' + path.sep + 'dependencies' + path.sep + fileName), { encoding: 'utf8' }))
  let analyzerOutput = JSON.parse(fs.readFileSync(path.join(__dirname, 'analyzerOutputs' + path.sep + 'dependencies' + path.sep + fileName), { encoding: 'utf8' }))
  assert.deepEqual(expectedOutput, analyzerOutput)
}

// 