const path = require('path');
const fs = require('fs');
const exec = require('child_process').exec;
var assert = require('assert');

describe('Test callChain.js', () => runTest('callChain.js'));
describe('Test callbackAnonymousChain.js', () => runTest('callbackAnonymousChain.js'));
describe('Test callbackChainDifferentCalls.js', () => runTest('callbackChainDifferentCalls.js'));
describe('Test callbackChainForLoop.js', () => runTest('callbackChainForLoop.js'));
describe('Test callbackNonBlockingFunctions.js', () => runTest('callbackNonBlockingFunctions.js'));
describe('Test callbackSingleAnonymousFunction.js', () => runTest('callbackSingleAnonymousFunction.js'));
describe('Test callbackSingleKnownFunction.js', () => runTest('callbackSingleKnownFunction.js'));
describe('Test callbackSingleKnownFunctionReturnValue.js', () => runTest('callbackSingleKnownFunctionReturnValue.js'));
describe('Test classInnerFunctionEvent.js', () => runTest('classInnerFunctionEvent.js'));
describe('Test classInnerFunctionForEach.js', () => runTest('classInnerFunctionForEach.js'));
describe('Test classInnerFunctionFunctionCall.js', () => runTest('classInnerFunctionFunctionCall.js'));
describe('Test classInnerFunctionTimeout.js', () => runTest('classInnerFunctionTimeout.js'));
describe('Test eventsAddAnonymousListenerDependency.js', () => runTest('eventsAddAnonymousListenerDependency.js'));
describe('Test eventsAddKnownListenerDependency.js', () => runTest('eventsAddKnownListenerDependency.js'));
describe('Test eventsAddListenerThenEmitDependency.js', () => runTest('eventsAddListenerThenEmitDependency.js'));
describe('Test eventsAnonymousListener.js', () => runTest('eventsAnonymousListener.js'));
describe('Test eventsCallThenAddListenerDependency.js', () => runTest('eventsCallThenAddListenerDependency.js'));
describe('Test eventsDifferentEmitters.js', () => runTest('eventsDifferentEmitters.js'));
describe('Test eventsMultipleListeners.js', () => runTest('eventsMultipleListeners.js'));
describe('Test eventsNestedEmitterListeners.js', () => runTest('eventsNestedEmitterListeners.js'));
describe('Test eventsOnceListener.js', () => runTest('eventsOnceListener.js'));
describe('Test eventsPrependListener.js', () => runTest('eventsPrependListener.js'));
describe('Test eventsPrependOnceListener.js', () => runTest('eventsPrependOnceListener.js'));
describe('Test eventsSingleListener.js', () => runTest('eventsSingleListener.js'));
describe('Test fetch.js', () => runTest('fetch.js'));
describe('Test functionCallNestedRequireModule.js', () => runTest('functionCallNestedRequireModule.js'));
describe('Test functionCallRequireModule.js', () => runTest('functionCallRequireModule.js'));
describe('Test functionCallRequireModuleGetArgs.js', () => runTest('functionCallRequireModuleGetArgs.js'));
describe('Test functionCallRequireModuleReturnValue.js', () => runTest('functionCallRequireModuleReturnValue.js'));
describe('Test functionCall_1.js', () => runTest('functionCall_1.js'));
describe('Test functionCall_2.js', () => runTest('functionCall_2.js'));
describe('Test functionCall_3.js', () => runTest('functionCall_3.js'));
describe('Test functionCall_4.js', () => runTest('functionCall_4.js'));
describe('Test immediateAndTimeoutOrdering.js', () => runTest('immediateAndTimeoutOrdering.js'));
describe('Test immediateMultipleImmediates.js', () => runTest('immediateMultipleImmediates.js'));
describe('Test immediateSingleAnonymousFunction.js', () => runTest('immediateSingleAnonymousFunction.js'));
describe('Test immediateSingleAnonymousFunctionGetArgs.js', () => runTest('immediateSingleAnonymousFunctionGetArgs.js'));
describe('Test immediateSingleKnownFunction.js', () => runTest('immediateSingleKnownFunction.js'));
describe('Test immediateSingleKnownFunctionGetArgs.js', () => runTest('immediateSingleKnownFunctionGetArgs.js'));
describe('Test immediateSingleKnownFunctionGetArgsNoPass.js', () => runTest('immediateSingleKnownFunctionGetArgsNoPass.js'));
describe('Test intervalSingleKnownFunction.js', () => runTest('intervalSingleKnownFunction.js'));
describe('Test intervalSingleKnownFunctionGetArgs.js', () => runTest('intervalSingleKnownFunctionGetArgs.js'));
describe('Test promise.js', () => runTest('promise.js'));
describe('Test timeoutFakeKnownFunction.js', () => runTest('timeoutFakeKnownFunction.js'));
describe('Test timeoutMultipleNestedTimeouts.js', () => runTest('timeoutMultipleNestedTimeouts.js'));
describe('Test timeoutMultipleTimeouts.js', () => runTest('timeoutMultipleTimeouts.js'));
describe('Test timeoutSingleAnonymousFunction.js', () => runTest('timeoutSingleAnonymousFunction.js'));
describe('Test timeoutSingleAnonymousFunctionGetArgs.js', () => runTest('timeoutSingleAnonymousFunctionGetArgs.js'));
describe('Test timeoutSingleAnonymousFunctionGetArgsNoPass.js', () => runTest('timeoutSingleAnonymousFunctionGetArgsNoPass.js'));
describe('Test timeoutSingleKnownFunction.js', () => runTest('timeoutSingleKnownFunction.js'));
describe('Test timeoutSingleKnownFunctionGetArgs.js', () => runTest('timeoutSingleKnownFunctionGetArgs.js'));
describe('Test timeoutSingleKnownFunctionGetArgsNoPass.js', () => runTest('timeoutSingleKnownFunctionGetArgsNoPass.js'));
describe('Test timeoutSingleKnownFunctionNoArgsPassVariable.js', () => runTest('timeoutSingleKnownFunctionNoArgsPassVariable.js'));
describe('Test timeoutZero.js', () => runTest('timeoutZero.js'));


const nodeprofCommand = '$GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis utils.js --analysis analyser.js test/unit_tests/'

function runTest(item) {
  it('Run nodeprof', function (done) {
    this.timeout(15000);
    execute(nodeprofCommand + item + " testMode", done)
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

function compairDependencies(fileName) {
  let expectedOutput = JSON.parse(fs.readFileSync(path.join(__dirname, 'expectedOutputs' + path.sep + 'dependencies' + path.sep + fileName + ".json"), { encoding: 'utf8' }))
  let analyzerOutput = JSON.parse(fs.readFileSync(path.join(__dirname, 'analyzerOutputs' + path.sep + 'dependencies' + path.sep + fileName + ".json"), { encoding: 'utf8' }))
  assert.deepEqual(expectedOutput, analyzerOutput)
}

