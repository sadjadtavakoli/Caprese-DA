// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');


let logger = "";
let testName = "";
let functionsIDs = new Map();
let functionEnterStack = [];
let timeoutsQueueMap = new Map();
let accessedFiles = [];

(function (sandbox) {
    function Analyser() {
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
            let fName = f.name;
            if (isConstructor) {
                f.isConstructor = true
                log(getLine(iid) + " class " + fName + "'s constructor is called with variables " + 'args' + " by " + functionEnterStack[functionEnterStack.length - 1].name)
            } else {
                if (isTimeOut(f)) {
                    addToTimeoutMap(args[0] + args[1], getLine(iid)) // line number, args, caller
                    fName += getLine(iid)
                } else if (fName == "") {
                    fName = 'unknown' + getLine(iid) + getPositionInLine(iid)
                    f.unknown_name = fName
                }
                log(getLine(iid) + " function " + fName + " is called with variables " + 'args' + " by " + functionEnterStack[functionEnterStack.length - 1].name)
            }

            return { f: f, base: base, args: args, skip: false };
        };

        this.functionEnter = function (iid, f, dis, args) {
            let fName = f.name;

            if (entringAnotherFile(iid)) {
                accessedFiles.push(getFilePath(iid))
                functionsIDs.set(iid, {'name': getFilePath(iid)})
            } else {
                if (isMainFile(iid)) {
                    testName = fName = getFileName(iid)
                } else {
                    if (f.isConstructor) {
                        log(getLine(iid) + " class " + fName + "'s constructor entered with variables " + 'args from ' + functionEnterStack[functionEnterStack.length - 1].name)
                    } else {
                        if (dis._idleTimeout !== undefined) {
                            functionEnterStack.push({ 'name': 'setTimeOut' + popFromTimeoutMap(f + dis._idleTimeout), 'isTimeout': true })
                            if (fName == "") {
                                fName = 'unknown' + getLine(iid)
                            }
                        }
                        if (fName == "") {
                            fName = f.unknown_name
                        }
                        log(getLine(iid) + " function " + fName + " entered with variables " + 'args from ' + functionEnterStack[functionEnterStack.length - 1].name)
                    }
                }

                let fInfo = { 'name': fName }
                functionEnterStack.push(fInfo)
                if (f.isConstructor) {
                    fInfo['isConstructor'] = true
                }
                functionsIDs.set(iid, fInfo)
            }
        };

        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!(entringAnotherFile(iid) || isMainFile(iid))) {
                functionEnterStack.pop()
                let caller = 'undefined'
                if (functionEnterStack.length > 0) {
                    caller = functionEnterStack[functionEnterStack.length - 1]
                    if (caller.isTimeOut) {
                        functionEnterStack.pop()
                    }
                }
                let f = functionsIDs.get(iid)
                if (f.isConstructor) {
                    log(getLine(iid) + " class " + f.name + "'s constructor exited with return values " + returnVal + " to function " + caller.name);
                } else {
                    log(getLine(iid) + " function " + f.name + " exited with return values " + returnVal + " to function " + caller.name);
                }
            }
            return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false };
        };

        this.endExecution = function () {
            log("end Execution");
            console.log(accessedFiles)
            fs.writeFileSync(path.join(__dirname, 'test/analyzerOutputs' + path.sep + testName), logger, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
        };

    }

    function getFileName(iid) {
        return getFilePath(iid).split('/')[2];
    }

    function getFilePath(iid) {
        return J$.iidToLocation(iid).split(':')[0];
    }
    function getLine(iid) {
        return J$.iidToLocation(iid).split(':')[1]
    }

    function getPositionInLine(iid) {
        return J$.iidToLocation(iid).split(':')[2]
    }

    function isMainFile(iid) {
        return (getLine(iid) == 1 && testName == "") || (functionsIDs.has(iid) && testName == functionsIDs.get(iid).name)
    }

    function entringAnotherFile(iid) {
        return (testName != "" && testName != getFileName(iid) && getLine(iid) == 1 && !accessedFiles.includes(getFilePath(iid)) || (functionsIDs.has(iid) && getFilePath(iid) == functionsIDs.get(iid).name))

    }
    function log(log_value) {
        logger += "\n#" + log_value
    }

    function isTimeOut(func) {
        return func == setTimeout
    }

    function addToTimeoutMap(key, value) {

        if (timeoutsQueueMap.has(key)) {
            timeoutsQueueMap.get(key).push(value) // line number, args, caller
        } else {
            timeoutsQueueMap.set(key, [value]) // line number, args, caller
        }
    }

    function popFromTimeoutMap(key) {
        if (timeoutsQueueMap.has(key)) {
            return timeoutsQueueMap.get(key).shift() // line number, args, caller
        }
    }

    sandbox.analysis = new Analyser();
})(J$);
