// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
let fs = require('fs')

let logger = "";
let testName = "";


(function (sandbox) {
    function Analyser() {
        let functionsIDs = new Map();

        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
            logger += "\n" + "function pre invoke => " + f.name +" in " + base +  " at => " + J$.iidToLocation(iid)
            logger += "\n" + iid
            // logger += "\n" + base)
            logger += "\n" + "function pre invoke variables => " + args
            return {f: f, base: base, args: args, skip: false};
        };
        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) {
            logger += "\n" + "function invoke => " + f.name +" in " + base +  " at => " + J$.iidToLocation(iid)
            logger += "\n" + "function invoke variables => " + args
            logger += "\n" + iid
            return {result: result};
        };

        // this.literal = function (iid, val, /* hasGetterSetter should be computed lazily */ fakeHasGetterSetter, literalType) {
        //     logger += "\n" + "literal => " + iid +" with value " + val +  " at => " + J$.iidToLocation(iid))
        //     return {result: val};
        // };

        // this.literal.types = ["ObjectLiteral", "ArrayLiteral", "FunctionLiteral", "NumericLiteral", "BooleanLiteral", "StringLiteral",
        //     "NullLiteral", "UndefinedLiteral", "RegExpLiteral"];

        this.getFieldPre = function (iid, base, offset, isComputed, isOpAssign, isMethodCall) {
            logger += "\n" + "getFieldPre => " + iid +" with base " + base +  " at => " + J$.iidToLocation(iid)
            logger += "\n" + offset
            return {base: base, offset: offset, skip: false};
        };
        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
            logger += "\n" + "getField => " + iid +" with base " + base +  " at => " + J$.iidToLocation(iid)
            logger += "\n" + offset
            logger += "\n" + val
            return {result: val};
        };

        this.putFieldPre = function (iid, base, offset, val, isComputed, isOpAssign) {
            logger += "\n" + "putFieldPre => " + iid +" with base " + base +  " at => " + J$.iidToLocation(iid)
            logger += "\n" + offset
            logger += "\n" + val
            return {base: base, offset: offset, val: val, skip: false};
        };
        this.putField = function (iid, base, offset, val, isComputed, isOpAssign) {
            logger += "\n" + "putField => " + iid +" with base " + base +  " at => " + J$.iidToLocation(iid)
            logger += "\n" + offset
            logger += "\n" + val
            return {result: val};
        };

        this.read = function (iid, name, val, isGlobal, isScriptLocal) {
            if(name!=="console"){
            logger += "\n" + "read => " + iid +" with base " + name +  " at => " + J$.iidToLocation(iid)
            logger += "\n" + "******* " + val
            return {result: val};
            }
        };
        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal) {
            logger += "\n" + "write => " + iid +" with base " + name +  " at => " + J$.iidToLocation(iid)
            logger += "\n" + "******* " + val
            return {result: val};
        };

        this.functionEnter = function (iid, f, dis, args) {
            if (iid === 1){
                testName = J$.iidToLocation(iid).split(':')[0].split('/')[2]
            }
            logger += "\n" + "function Enter => " + f.name +" with id " + iid +  " at => " + J$.iidToLocation(iid)
            functionsIDs.set(iid, f.name)
        };
        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            logger += "\n" + "function Exit => " + functionsIDs.get(iid) + " with id " + iid +  " at => " + J$.iidToLocation(iid)
            return {returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false};
        };

        // this.builtinEnter = function (name, f, dis, args) {
        //     logger += "\n" + "builtinEnter Enter => " + name +" with name " + f.name)
        // };
        // this.builtinExit = function (name, f, dis, args, returnVal, exceptionVal) {
        //     // logger += "\n" + "builtinExit Exit => " + name +" with name " + f.name)
        //     return {returnVal: returnVal};
        // };

        // this.binaryPre = function (iid, op, left, right) {
        //     logger += "\n" + "binaryPre")
        //     return {op: op, left: left, right: right, skip: false};
        // };
        // this.binary = function (iid, op, left, right, result) {
        //     logger += "\n" + "binary")
        //     return {result: result};
        // };
        //
        // this.unaryPre = function (iid, op, left) {
        //     logger += "\n" + "unaryPre")
        //     return {op: op, left: left, skip: false};
        // };
        // this.unary = function (iid, op, left, result) {
        //     logger += "\n" + "unary")
        //     return {result: result};
        // };

        this.conditional = function (iid, result) {
            logger += "\n" + "conditional"
            return {result: result};
        };

        // this.startExpression = function (iid, type) {
        //     logger += "\n" + "startExpression " + type)
        // };
        //
        // this.endExpression = function (iid, type, result) {
        //     logger += "\n" + "endExpression " +  type)
        // };

        this.endExecution = function () {
            logger += "\n" + "end Execution"
            fs.writeFileSync(path.join(__dirname, 'test/analyzerOutputs' + path.sep + testName), logger, function(err) {
                console.log("hey!")
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
        };

    }

    sandbox.analysis = new Analyser();
})(J$);
