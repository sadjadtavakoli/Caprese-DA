// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');
const { DA_DEPENDENCIES_PATH } = require('../constants')

let mainFilePath = "";
let functionEnterStack = [];
let callbackSet = new Set();
let functionsFuncInput = new Map();
let accessedFiles = new Map();
let addedListeners = new Map();
let functionIDs = new Map();
let functionsDependency = {}
let tempIDsMap = {};
let listOfVariables = new Map();
let readAndDeclarations = new Map();
let fields = new Map();

// functions if return value can affect their caller and it they have arguments, 
// the caller affects them. The same scenario goes for timeout functions. 
// Therefor, timeout setters are the ones affecting the functions inside the timeout but only if those function have arguments. 
// \newLine
// Similarly, for events, the listener is impacted by the emitter if the emitter passes data to it. 
// Now, what about the setListener and the emitter? they both are working with the same event, and setListener function is the bridge between listener and emitter.
// So, are they affected by each other? If so, what about the global variables? do they have the same impact? 
(function (sandbox) {
    let utils = sandbox.Utils;
    function Analyser() {

        /**
         * These callbacks are called before and after a function, method, or constructor invocation.
        **/
        this.invokeFunPre = function (iid, f, base, args) {
            if (isImporting(iid)) {
                return { f: f, base: base, args: args, skip: false };
            }

            // The last function of the functionEnterStack is the caller function 
            let callerFunction = functionEnterStack[functionEnterStack.length - 1]
            if (utils.isAddEventlistener(f)) {
                let listenerBaseID = getSetBaseID(args[1], iid)
                addToAddedListener(getSetBaseID(base, "b" + iid), args[0], listenerBaseID, callerFunction)
                // If the listener function's ID does not exist in function's ID map, we assign an ID to it and store it in the ID map.

            } else if (utils.isEmitEvent(f)) {
                let baseID = getSetBaseID(base, "b" + iid)
                let eventInfo = getAddedListeners(baseID, args[0])

                if (eventInfo.length) {
                    let listeners = eventInfo[0]
                    let setters = eventInfo[1]

                    // We add setter and adder to each other's impactSet
                    setters.forEach(setter => {
                        addImpact(setter.fID, callerFunction.baseID)
                        addImpact(callerFunction.fID, setter.baseID)
                    })

                    /*
                    * For the listeners, we add listeners into callerFunctions impactSet only if 
                    * the emitter passes arguments with the emitted event. 
                    */
                    if (args[1] != undefined) {
                        listeners.forEach(listener => {
                            addImpact(callerFunction.fID, listener)
                        })
                    }
                }

            } else {
                if (utils.isSetTimeout(f) || utils.isSetInterval(f)) {
                    if (args[2] != undefined) {
                        addImpact(callerFunction.fID, getSetBaseID(args[0], iid))
                    }
                } else if (utils.isSetImmediate(f)) {
                    if (args[1] != undefined) {
                        addImpact(callerFunction.fID, getSetBaseID(args[0], iid))
                    }
                } else {
                    let fID = getFID(f, iid)
                    let funcArgs = []
                    removeFromCallbackMap(f, iid)
                    for (let i = 0; i < args.length; i = i + 1) {
                        if (typeof args[i] == "function") { // iterate over function arguments and records functions.
                            // This information is used in enterFunction to filter our callback like forEach, map, etc from regular inner callbacks
                            let argID = getSetBaseID(args[i], iid + `${i}`)
                            funcArgs.push(argID)
                            addToCallbackMap(argID)
                        }
                    }
                    if (funcArgs.length) {
                        addToFunctionsFuncInputs(fID, funcArgs)
                    }
                }
            }
            return { f: f, base: base, args: args, skip: false };
        };

        /**
         * These callbacks are called before the execution of a function body starts.
         **/
        this.functionEnter = function (iid, f, dis, args) {
            let fID = getFID(f, iid)
            let baseID = getSetBaseID(f, iid)
            tempIDsMap[baseID] = fID
            let data = { 'baseID': baseID, 'fID': fID }

            if (isMainFile(iid)) {
                if (mainFilePath == "") {
                    mainFilePath = utils.getFilePath(iid)
                    accessedFiles.set(mainFilePath, { 'iid': iid, 'fID': fID, 'baseID': baseID })
                }
                functionEnterStack.push(data)
                declarePost(fID)
            } else if (isImporting(iid)) {
                accessedFiles.set(utils.getFilePath(iid), { 'iid': iid, 'fID': fID, 'baseID': baseID })
            } else {

                if (!utils.isCalledByCallBackRequiredFunctions(dis)) {
                    removeStoredFuncInputs(fID)
                    if (!isACallBack(f, iid)) {
                        let caller = functionEnterStack[functionEnterStack.length - 1]
                        if (caller == undefined) {
                            let filePath = utils.getFilePath(iid)
                            caller = accessedFiles.get(filePath)
                        }
                        addImpact(fID, caller.baseID) // adds the caller function to the callee's impact-list 
                        if (args.length) { // adds a function to its caller impact-list if its signature accepts arguments 
                            addImpact(caller.fID, baseID)
                        }
                    }
                }
                functionEnterStack.push(data)
                declarePost(fID)
            }
        };

        /**
         * These callbacks are called after the execution of a function body.
         **/
        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!(isImporting(iid))) { // new
                let f = functionEnterStack.pop()
                manageVarAccess(f)
                // console.log(f.fID, "existed!")
            }
            if (isMainFile(iid)) {// new
                mainFilePath = ""
            }
            return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false };
        };

        /**
         * This callback is called when an execution terminates in node.js.
         **/
        this.endExecution = function () {
            let depdendenciesPath;
            if (!process.argv[2]) {
                depdendenciesPath = DA_DEPENDENCIES_PATH
            } else {
                const mainFileName = utils.filePathToFileName(Array.from(accessedFiles.keys())[0]);
                let depDir = path.join(__dirname, 'test' + path.sep + 'analyzerOutputs')
                if (!fs.existsSync(depDir)) {
                    fs.mkdirSync(depDir);
                }
                depdendenciesPath = path.join(depDir + path.sep + mainFileName + ".json")
            }

            for (const item in functionsDependency) {
                functionsDependency[item]['impacted'] = [...functionsDependency[item]['impacted']]
            }
            functionsDependency['keyMap'] = tempIDsMap

            fs.writeFileSync(depdendenciesPath, JSON.stringify(functionsDependency), function (err) {
                if (err) {
                    console.log(err);
                }
                console.log("Dependencies file was saved!");
            });
        };


        let tempDeclarationList = []
        /**
         *  Declaration of a symbol, type can be `const, let, var`
         *  Jalangi version: this.declare = function (iid, name, val, isArgument, argumentIndex, isCatchParam) {
         **/
        this.declare = function (iid, name, type, kind) {
            if (kind == undefined) {
                let varName = getVarName(name, false)
                tempDeclarationList.push(varName)
            }
        };

        /**
         * Records declared variables inside a function after functionEnter method's execution
         * @param fID as a function's ID
         **/
        function declarePost(fID) {
            for (let variable of tempDeclarationList) {

                if (listOfVariables.has(variable)) {
                    listOfVariables.get(variable).push({ 'declare': fID, 'writers': [fID] })
                } else {
                    listOfVariables.set(variable, [{ 'declare': fID, 'writers': [fID] }])
                }

                if (readAndDeclarations.has(fID)) {
                    readAndDeclarations.get(fID)['declareds'].push(variable)
                } else {
                    readAndDeclarations.set(fID, { 'reads': { true: [], false: [] }, 'declareds': [variable] })
                }
            }
            tempDeclarationList = []
        }

        /**
         * This callback is called after a variable is read
         * It also records each function's read and declared variables
         **/
        this.read = function (iid, name, val, isGlobal, isScriptLocal) {
            if (typeof val != "function" && typeof val != "object" && name != "this") {

                let fID = functionEnterStack[functionEnterStack.length - 1].fID;
                if (readAndDeclarations.has(fID)) {
                    readAndDeclarations.get(fID)['reads'][isGlobal].push(name)
                } else {
                    let data = { 'reads': { true: [], false: [] } }
                    // let data = { 'reads': { true: [], false: [] }, 'declareds': [] }
                    data['reads'][isGlobal].push(name)
                    readAndDeclarations.set(fID, data)
                }
                // console.log("read...", name, "line: ", utils.getLine(iid), isGlobal, isScriptLocal, "......................")

            }
            return { result: val };
        };

        /**
         * This callback is called after a variable is writtern
         * It also keeps a record of each variable's writers
         **/
        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal) {
            if (typeof val != "function" && typeof val != "object" && name != "this") {
                // console.log("write...", name, val, "line: ", utils.getLine(iid), isGlobal, isScriptLocal, "......................")

                let fID = functionEnterStack[functionEnterStack.length - 1].fID;
                let varName = getVarName(name, isGlobal)
                if (listOfVariables.has(varName)) {
                    let declrations = listOfVariables.get(varName)
                    let closestDeclaration = declrations[declrations.length - 1]
                    if (!closestDeclaration['writers'].includes(fID)) closestDeclaration['writers'].push(fID)
                } else {
                    listOfVariables.set(varName, [{ 'declare': NaN, 'writers': [fID] }])
                }
            }
            return { result: val };
        };

        /**
         * This method is called at the end of functionExit
         * It updates each functions dependencies based on its read/declared variables
         * At the end it deletes any unnecessary data related to them
         **/
        function manageVarAccess(f) {
            let fID = f.fID
            if (readAndDeclarations.has(fID)) {

                let accessedVars = readAndDeclarations.get(fID)
                let reads = accessedVars['reads'][false]
                let declareds = accessedVars['declareds']
                declareds = declareds != undefined ? declareds : []
                let readsGlobals = accessedVars['reads'][true]

                let writers = []
                for (let name of reads) {
                    let varName = getVarName(name, false)
                    if (!declareds.includes(varName)) {
                        writers = writers.concat(getWritersOfVar(varName))
                    }
                }

                for (let name of readsGlobals) {
                    let varName = getVarName(name, true)
                    writers = writers.concat(getWritersOfVar(varName))
                }

                readAndDeclarations.delete(fID)

                for (let variable of declareds) {
                    let declrations = listOfVariables.get(variable)
                    if (declrations.length <= 1) {
                        listOfVariables.delete(variable)
                    } else {
                        declrations.pop()
                    }
                }

                for (let writer of writers) {
                    addImpact(writer, f.baseID)
                }
            }

        }

        function getWritersOfVar(varName) {
            if (listOfVariables.has(varName)) {
                let declrations = listOfVariables.get(varName);
                let closestDeclaration = declrations[declrations.length - 1];
                return closestDeclaration['writers'];
            }
            return []
        }

        /**
         * This callback is called before a property of an object is accessed
         * For each non-function property, it adds the current function to all
         * of its writers' impact set. 
         **/
        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
            if (typeof val != "function" && typeof val != "object") {
                // console.log("getField...", base, offset, val, isComputed, isOpAssign, isMethodCall)
                let baseID = functionEnterStack[functionEnterStack.length - 1].baseID
                let key = offset.toString() + getSetBaseID(base, "b" + iid);
                if (fields.has(key)) {
                    for (let writer of fields.get(key)) {
                        addImpact(writer, baseID)
                    }
                }
            }
            return { result: val };
        };

        /**
         * This callback is called before a property of an object is written
         * For each non-function property, it records all writers in a list
         **/
        this.putField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
            if (typeof val != "function" && typeof val != "object") {
                // console.log("putField...", base, offset, val, isComputed, isOpAssign, isMethodCall)
                let fID = functionEnterStack[functionEnterStack.length - 1].fID
                let key = offset.toString() + getSetBaseID(base, "b" + iid);
                if (fields.has(key)) {
                    let writers = fields.get(key)
                    if (!writers.includes(fID)) writers.push(fID)
                } else {
                    fields.set(key, [fID])
                }
            }

            return { result: val };
        };
    }

    /**
     * this function checks wheather iid is for mainFile enterance or else 
     */
    function isMainFile(iid) {
        let accedFileID = accessedFiles.get(mainFilePath)
        return (utils.getLine(iid) == 1 && mainFilePath == "") || (accedFileID != undefined && accedFileID.iid == iid)
    }

    /**
     * this function checks wheather iid is for importing a new file/module or else 
     */
    function isImporting(iid) {
        let filePath = utils.getFilePath(iid)
        let accedFileID = accessedFiles.get(filePath)
        return mainFilePath != filePath && (accedFileID == undefined || accedFileID.iid == iid)
    }

    function addImpact(changed, impacted) {
        if (!functionsDependency[changed]) {
            functionsDependency[changed] = { 'impacted': new Set([]) }
        }
        functionsDependency[changed]['impacted'].add(impacted)
    }

    /**
     * 
     * @param key parameter function's id
     * @param mainFunction function which we are calling this method on its parameters
     * @param caller mainFunction's caller function
     */
    function addToCallbackMap(key) {
        callbackSet.add(key)
    }

    function addToFunctionsFuncInputs(key, list) {
        if (functionsFuncInput.has(key)) {
            functionsFuncInput.get(key).concat(list)
        } else {
            functionsFuncInput.set(key, list)
        }
    }

    /**
     * ValidateCallBackMap removes the given FID function's function arguments from callback calls list
     * since they will be called directly by this function during its execution 
     * @param {String} fID 
     */
    function removeStoredFuncInputs(fID) {
        if (functionsFuncInput.has(fID)) {
            let argsList = functionsFuncInput.get(fID)
            for (let item of argsList) {
                callbackSet.delete(item)
            }
            functionsFuncInput.delete(fID)
        }
    }

    function isACallBack(f, iid) {
        return callbackSet.has(getSetBaseID(f, iid))
    }

    function removeFromCallbackMap(f, iid) {
        return callbackSet.delete(getSetBaseID(f, iid))
    }

    function addToAddedListener(baseID, event, listenerBaseID, caller) {
        let baseEvents = addedListeners.get(baseID)
        if (!baseEvents) {
            addedListeners.set(baseID, new Map().set(event, [new Set([listenerBaseID]), new Set([caller])]))
        } else if (!baseEvents.has(event)) {
            baseEvents.set(event, [new Set([listenerBaseID]), new Set([caller])])
        } else {
            baseEvents.get(event)[0].add(listenerBaseID)
            baseEvents.get(event)[1].add(caller)

        }
    }

    function getAddedListeners(baseID, event) {
        let baseEvents = addedListeners.get(baseID)
        if (baseEvents && baseEvents.has(event)) {
            let info = baseEvents.get(event)
            return [[...info[0]], [...info[1]]]
        }
        return []
    }

    function getSetBaseID(func, iid) {
        if (functionIDs.has(func)) {
            return functionIDs.get(func)
        }
        let id = 't_' + iid
        functionIDs.set(func, id)
        return id
    }

    function getFID(func, iid) {
        let functionName = func.name
        if (!functionName) {
            if (isMainFile(iid) || isImporting(iid)) {
                functionName = undefined
            } else {
                functionName = "arrowAnonymousFunction"
            }
        }
        func = utils.getIIDKey(functionName, iid)
        return func
    }

    function getVarName(name, isGlobal) {
        let ext = isGlobal ? "t" : "f";
        let varName = `${name}-${ext}`
        return varName
    }

    sandbox.analysis = new Analyser();
})(J$);
