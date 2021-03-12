// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');


let logger = "";
let testName = "";
let functionsIDs = new Map();
let functionEnterStack = [];
var timeoutsQueueMap = new Map();

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

        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) {
            return { result: result };
        };

        this.literal = function (iid, val, /* hasGetterSetter should be computed lazily */ fakeHasGetterSetter, literalType) {
            return { result: val };
        };

        this.literal.types = ["ObjectLiteral", "ArrayLiteral", "FunctionLiteral", "NumericLiteral", "BooleanLiteral", "StringLiteral",
            "NullLiteral", "UndefinedLiteral", "RegExpLiteral"];

        this.getFieldPre = function (iid, base, offset, isComputed, isOpAssign, isMethodCall) {
            return { base: base, offset: offset, skip: false };
        };
        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
            return { result: val };
        };

        this.putFieldPre = function (iid, base, offset, val, isComputed, isOpAssign) {
            return { base: base, offset: offset, val: val, skip: false };
        };
        this.putField = function (iid, base, offset, val, isComputed, isOpAssign) {
            return { result: val };
        };

        this.read = function (iid, name, val, isGlobal, isScriptLocal) {
            // log( getLine(iid) + ' variable ' + name + ' read by function ' + functionCallStack[functionCallStack.length - 1].name);
        };
        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal) {
            // log( getLine(iid) + ' variable ' + name + ' write ' + 'WHICH VARIABLE?' + ' by function ' + functionCallStack[functionCallStack.length - 1].name);
            return { result: val };
        };

        this.functionEnter = function (iid, f, dis, args) {
            let fName = f.name;
            if (isMainFile(iid)) {
                testName = fName = getTestName(iid)
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
        };

        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!isMainFile(iid)) {
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

        this.builtinEnter = function (name, f, dis, args) {
            //     log("builtinEnter Enter => " + name +" with name " + f.name)
        };

        this.builtinExit = function (name, f, dis, args, returnVal, exceptionVal) {
            //     log("builtinExit Exit => " + name +" with name " + f.name)
            return { returnVal: returnVal };
        };

        this.binaryPre = function (iid, op, left, right) {
            //     log("binaryPre")
            return { op: op, left: left, right: right, skip: false };
        };

        this.binary = function (iid, op, left, right, result) {
            //     log("binary")
            return { result: result };
        };
        //
        this.unaryPre = function (iid, op, left) {
            //     log("unaryPre")
            return { op: op, left: left, skip: false };
        };

        this.unary = function (iid, op, left, result) {
            //     log("unary")
            return { result: result };
        };

        this.conditional = function (iid, result) {
            //     log("conditional")
            return { result: result };
        };

        this.startExpression = function (iid, type) {
            //     logger += "\n expression"
            //     log("startExpression " + type)
        };
        //
        this.endExpression = function (iid, type, result) {
            //     log("endExpression " +  type)
        };

        this.endExecution = function () {
            log("end Execution");
            fs.writeFileSync(path.join(__dirname, 'test/analyzerOutputs' + path.sep + testName), logger, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
        };

    }

    function getTestName(iid) {
        return J$.iidToLocation(iid).split(':')[0].split('/')[2];
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
