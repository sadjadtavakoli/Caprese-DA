// do not remove the following comment
// JALANGI DO NOT INSTRUMENT

(function (sandbox) {
    function Analyser() {
        let functionsIDs = new Map();

        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
            console.log("function pre invoke => " + f.name +" in " + base +  " at => " + J$.iidToLocation(iid))
            console.log(iid)
            // console.log(base)
            console.log("function pre invoke variables => ", args)
            return {f: f, base: base, args: args, skip: false};
        };
        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod, functionIid, functionSid) {
            console.log("function invoke => " + f.name +" in " + base +  " at => " + J$.iidToLocation(iid))
            console.log("function invoke variables => ", args)
            console.log(iid)
            return {result: result};
        };

        // this.literal = function (iid, val, /* hasGetterSetter should be computed lazily */ fakeHasGetterSetter, literalType) {
        //     console.log("literal => " + iid +" with value " + val +  " at => " + J$.iidToLocation(iid))
        //     return {result: val};
        // };

        // this.literal.types = ["ObjectLiteral", "ArrayLiteral", "FunctionLiteral", "NumericLiteral", "BooleanLiteral", "StringLiteral",
        //     "NullLiteral", "UndefinedLiteral", "RegExpLiteral"];

        this.getFieldPre = function (iid, base, offset, isComputed, isOpAssign, isMethodCall) {
            console.log("getFieldPre => " + iid +" with base " + base +  " at => " + J$.iidToLocation(iid))
            console.log(offset)
            return {base: base, offset: offset, skip: false};
        };
        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
            console.log("getField => " + iid +" with base " + base +  " at => " + J$.iidToLocation(iid))
            console.log(offset)
            console.log(val)
            return {result: val};
        };

        this.putFieldPre = function (iid, base, offset, val, isComputed, isOpAssign) {
            console.log("putFieldPre => " + iid +" with base " + base +  " at => " + J$.iidToLocation(iid))
            console.log(offset)
            console.log(val)
            return {base: base, offset: offset, val: val, skip: false};
        };
        this.putField = function (iid, base, offset, val, isComputed, isOpAssign) {
            console.log("putField => " + iid +" with base " + base +  " at => " + J$.iidToLocation(iid))
            console.log(offset)
            console.log(val)
            return {result: val};
        };

        this.read = function (iid, name, val, isGlobal, isScriptLocal) {
            if(name!=="console"){
            console.log("read => " + iid +" with base " + name +  " at => " + J$.iidToLocation(iid))
            console.log("******* " + val)
            return {result: val};
            }
        };
        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal) {
            console.log("write => " + iid +" with base " + name +  " at => " + J$.iidToLocation(iid))
            console.log("******* " + val)
            return {result: val};
        };

        this.functionEnter = function (iid, f, dis, args) {
            console.log("function Enter => " + f.name +" with id " + iid +  " at => " + J$.iidToLocation(iid))
            functionsIDs.set(iid, f.name)
        };
        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            console.log("function Exit => " + functionsIDs.get(iid) + " with id " + iid +  " at => " + J$.iidToLocation(iid))
            return {returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false};
        };

        // this.builtinEnter = function (name, f, dis, args) {
        //     console.log("builtinEnter Enter => " + name +" with name " + f.name)
        // };
        // this.builtinExit = function (name, f, dis, args, returnVal, exceptionVal) {
        //     // console.log("builtinExit Exit => " + name +" with name " + f.name)
        //     return {returnVal: returnVal};
        // };

        // this.binaryPre = function (iid, op, left, right) {
        //     console.log("binaryPre")
        //     return {op: op, left: left, right: right, skip: false};
        // };
        // this.binary = function (iid, op, left, right, result) {
        //     console.log("binary")
        //     return {result: result};
        // };
        //
        // this.unaryPre = function (iid, op, left) {
        //     console.log("unaryPre")
        //     return {op: op, left: left, skip: false};
        // };
        // this.unary = function (iid, op, left, result) {
        //     console.log("unary")
        //     return {result: result};
        // };

        this.conditional = function (iid, result) {
            console.log("conditional")
            return {result: result};
        };

        // this.startExpression = function (iid, type) {
        //     console.log("startExpression " + type)
        // };
        //
        // this.endExpression = function (iid, type, result) {
        //     console.log("endExpression " +  type)
        // };

        this.endExecution = function () {
            console.log("end Execution")
        };

    }

    sandbox.analysis = new Analyser();
})(J$);
