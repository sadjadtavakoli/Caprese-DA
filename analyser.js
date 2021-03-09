// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');


let logger = "";
let testName = "";
let functionsIDs = new Map();
let functionCallStack = [];
let variableReads = new Map();
let functionsVariables = new Map();
var regExp = /\(([^)]*)\)/;

(function (sandbox) {
    function Analyser() {
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
            let fName = f.name;
            if (fName == "") {
                fName = 'unknown' + getLine(iid)
            }
            logger += "\n#" + getLine(iid) + " function " + fName + " is called with variables " + 'args' + " by " + functionCallStack[functionCallStack.length - 1]
            // logger += "\n#" + Object.getOwnPropertyNames(f)
            // var regExp = /\(([^)]*)\)/;
            // var matches = regExp.exec(String(f).split('{')[0]);
            // console.log(matches[1].split(','))
            return { f: f, base: base, args: args, skip: false };
        };

        function getLine(iid) {
            return J$.iidToLocation(iid).split(':')[1]
        }

        function isMainFile(iid){
            return (getLine(iid) == 1 && testName == "") || (functionsIDs.has(iid) && testName == functionsIDs.get(iid)) 
        }

        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) {
            return {result: result};
        };

        this.literal = function (iid, val, /* hasGetterSetter should be computed lazily */ fakeHasGetterSetter, literalType) {
            return {result: val};
        };

        this.literal.types = ["ObjectLiteral", "ArrayLiteral", "FunctionLiteral", "NumericLiteral", "BooleanLiteral", "StringLiteral",
            "NullLiteral", "UndefinedLiteral", "RegExpLiteral"];

        this.getFieldPre = function (iid, base, offset, isComputed, isOpAssign, isMethodCall) {
            return {base: base, offset: offset, skip: false};
        };
        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
            return {result: val};
        };

        this.putFieldPre = function (iid, base, offset, val, isComputed, isOpAssign) {
            return {base: base, offset: offset, val: val, skip: false};
        };
        this.putField = function (iid, base, offset, val, isComputed, isOpAssign) {
            return {result: val};
        };

        this.read = function (iid, name, val, isGlobal, isScriptLocal) {
            // logger += "\n#" + getLine(iid) + ' variable ' + name + ' read by function ' + functionCallStack[functionCallStack.length - 1].name;
            // if(variableReads.has(getLine(iid))){
            //     variableReads.get(getLine(iid)).push(name)
            // }else{
            //     variableReads.set(getLine(iid), [name])
            // }
        };
        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal) {
            // logger += "\n#" + getLine(iid) + ' variable ' + name + ' write ' + 'WHICH VARIABLE?' + ' by function ' + functionCallStack[functionCallStack.length - 1].name;
            return { result: val };
        };

        this.functionEnter = function (iid, f, dis, args) {
            let fName = f.name;
            if (isMainFile(iid)) {
                testName = fName = J$.iidToLocation(iid).split(':')[0].split('/')[2]
            } else {
                if (fName == "") {
                    fName = 'unknown' + getLine(iid)
                }
                logger += "\n#" + getLine(iid) + " function " + fName + " entered with variables " + 'args'
            }
            functionCallStack.push(fName)
            functionsIDs.set(iid, fName)
    
        };

        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!isMainFile(iid)) {
                functionCallStack.pop()
                let caller = 'NaN'
                if (functionCallStack.length > 0) {
                    caller = functionCallStack[functionCallStack.length - 1]
                }
                logger += "\n#" + getLine(iid) + " function " + functionsIDs.get(iid) + " exited with return values " + returnVal + " to function " + caller;
            }
            return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false };
        };

        this.builtinEnter = function (name, f, dis, args) {
        //     logger += "\n" + "builtinEnter Enter => " + name +" with name " + f.name
        };
        
        this.builtinExit = function (name, f, dis, args, returnVal, exceptionVal) {
        //     logger += "\n" + "builtinExit Exit => " + name +" with name " + f.name
            return {returnVal: returnVal};
        };

        this.binaryPre = function (iid, op, left, right) {
        //     logger += "\n" + "binaryPre")
            return {op: op, left: left, right: right, skip: false};
        };
        
        this.binary = function (iid, op, left, right, result) {
        //     logger += "\n" + "binary")
            return {result: result};
        };
        //
        this.unaryPre = function (iid, op, left) {
        //     logger += "\n" + "unaryPre")
            return {op: op, left: left, skip: false};
        };
        
        this.unary = function (iid, op, left, result) {
        //     logger += "\n" + "unary")
            return {result: result};
        };

        this.conditional = function (iid, result) {
        //     logger += "\n" + "conditional"
            return {result: result};
        };

        this.startExpression = function (iid, type) {
        //     logger += "\n expression"
        //     logger += "\n" + "startExpression " + type
        };
        //
        this.endExpression = function (iid, type, result) {
        //     logger += "\n" + "endExpression " +  type)
        };

        this.endExecution = function () {
            logger += "\n" + "end Execution";
            fs.writeFileSync(path.join(__dirname, 'test/analyzerOutputs' + path.sep + testName), logger, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
        };

    }

    sandbox.analysis = new Analyser();
})(J$);
