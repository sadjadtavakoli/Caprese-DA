// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');
const { DA_DEPENDENCIES_PATH } = require('../constants')

let mainFilePath = "";
let functionEnterStack = [];
let callbackMap = new Map();
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
                let listenerID = getID(args[1], iid)

                addToAddedListener(getID(base, "b" + iid), args[0], listenerID, callerFunction.fID)
                // If the listener function's ID does not exist in function's ID map, we assign an ID to it and store it in the ID map.
                if (!tempIDsMap[listenerID]) tempIDsMap[listenerID] = utils.getIIDKey(getFunctionName(args[1], iid), iid)

            } else if (utils.isEmitEvent(f)) {
                let baseID = getID(base, "b" + iid)
                let eventInfo = getAddedListeners(baseID, args[0])

                if (eventInfo.length) {
                    let listeners = eventInfo[0]
                    let setters = eventInfo[1]

                    // We add setter and adder to each other's impactSet
                    setters.forEach(setter => {
                        addImpact(setter, callerFunction.fID)
                        addImpact(callerFunction.fID, setter)
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
                        addImpact(callerFunction.fID, getID(args[0], iid))
                    }
                } else if (utils.isSetImmediate(f)) {
                    if (args[1] != undefined) {
                        addImpact(callerFunction.fID, getID(args[0], iid))
                    }
                } else {
                    let fID = getID(f, iid)
                    let funcArgs = []
                    removeFromCallbackMap(fID)
                    for (let i = 0; i < args.length; i = i + 1) {
                        if (typeof args[i] == "function") { // iterate over function arguments and records functions.
                            // This information is used in enterFunction to filter our callback like forEach, map, etc from regular inner callbacks
                            let argID = getID(args[i], iid + `${i}`)
                            funcArgs.push(argID)
                            addToCallbackMap(argID, fID, callerFunction)
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
            let fID = getID(f, iid)
            let data = { 'iid': iid, 'fID': fID }

            if (isMainFile(iid)) {
                if (mainFilePath == "") {
                    mainFilePath = utils.getFilePath(iid)
                    accessedFiles.set(mainFilePath, iid)
                    tempIDsMap[fID] = utils.getIIDKey(utils.getIIDFileName(iid), iid)
                }
                functionEnterStack.push(data)
                declarePost(fID)
            } else if (isImporting(iid)) {
                tempIDsMap[fID] = utils.getIIDKey(utils.getIIDFileName(iid), iid)
                accessedFiles.set(utils.getFilePath(iid), iid)
            } else {
                let functionName = getFunctionName(f, iid)
                tempIDsMap[fID] = utils.getIIDKey(functionName, iid)

                if (!utils.isCalledByCallBackRequiredFunctions(dis)) {
                    validateCallBackMap(fID)
                    let argCheck = getFromCallbackMap(fID)
                    let caller;
                    if (argCheck == undefined) {
                        caller = functionEnterStack[functionEnterStack.length - 1]
                        addImpact(fID, caller.fID) // adds the caller function to the callee's impact-list 
                        if (args.length) { // adds a function to its caller impact-list if its signature accepts arguments 
                            addImpact(caller.fID, fID)
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
            if (!(isImporting(iid) || isMainFile(iid))) {
                let f = functionEnterStack.pop()
                manageVarAccess(f.fID)
            }
            return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false };
        };

        /**
         * This callback is called when an execution terminates in node.js.
         **/
        this.endExecution = function () {
            const mainFileName = utils.filePathToFileName(mainFilePath);
            let depdendenciesPath;
            if (!process.argv[2]) {
                depdendenciesPath = DA_DEPENDENCIES_PATH
            } else {
                let depDir = path.join(__dirname, 'test' + path.sep + 'analyzerOutputs')
                if (!fs.existsSync(depDir)) {
                    fs.mkdirSync(depDir);
                }
                depdendenciesPath = path.join(depDir + path.sep + mainFileName + ".json")
            }

            let functionDependenciesByKeys = {}
            for (const item in functionsDependency) {
                let mappedKey = tempIDsMap[item]
                functionDependenciesByKeys[mappedKey] = { 'impacted': [...functionsDependency[item]['impacted']] }
                delete functionsDependency[item]
            }
            functionDependenciesByKeys['keyMap'] = tempIDsMap

            fs.writeFileSync(depdendenciesPath, JSON.stringify(functionDependenciesByKeys), function (err) {
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
        function manageVarAccess(fID) {
            if (readAndDeclarations.has(fID)) {

                let accessedVars = readAndDeclarations.get(fID)
                let reads = accessedVars['reads'][false]
                let declareds = accessedVars['declareds']
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
                    addImpact(writer, fID)
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
            if (typeof val != "function") {
                // console.log("getField...", base, offset, val, isComputed, isOpAssign, isMethodCall)
                let fID = functionEnterStack[functionEnterStack.length - 1].fID
                let key = offset + getID(base, "b" + iid);
                if (fields.has(key)) {
                    for (let writer of fields.get(key)) {
                        addImpact(writer, fID)
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
            if (typeof val != "function") {
                // console.log("putField...", base, offset, val, isComputed, isOpAssign, isMethodCall)
                let fID = functionEnterStack[functionEnterStack.length - 1].fID
                let key = offset + getID(base, "b" + iid);
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
        return (utils.getLine(iid) == 1 && mainFilePath == "") || accessedFiles.get(mainFilePath) == iid
    }

    /**
     * this function checks wheather iid is for importing a new file/module or else 
     */
    function isImporting(iid) {
        let filePath = utils.getFilePath(iid)
        let accedFileID = accessedFiles.get(filePath)
        return mainFilePath != filePath && (accedFileID == undefined || accedFileID == iid)
    }

    /**
     * 
     * @param key parameter function's id
     * @param mainFunction function which we are calling this method on its parameters
     * @param caller mainFunction's caller function
     */
    function addToCallbackMap(key, mainFunction, caller) {
        callbackMap.set(key, [mainFunction, caller])
    }

    function addToFunctionsFuncInputs(key, list) {
        if (functionsFuncInput.has(key)) {
            functionsFuncInput.get(key).concat(list)
        } else {
            functionsFuncInput.set(key, list)
        }
    }

    function addToAddedListener(baseID, event, listener, caller) {
        let baseEvents = addedListeners.get(baseID)
        if (!baseEvents) {
            addedListeners.set(baseID, new Map().set(event, [new Set([listener]), new Set([caller])]))
        } else if (!baseEvents.has(event)) {
            baseEvents.set(event, [new Set([listener]), new Set([caller])])
        } else {
            baseEvents.get(event)[0].add(listener)
            baseEvents.get(event)[1].add(caller)

        }
    }

    function addImpact(changed, impacted) {
        if (!functionsDependency[changed]) {
            functionsDependency[changed] = { 'impacted': new Set([]) }
        }
        functionsDependency[changed]['impacted'].add(impacted)
    }

    /**
     * ValidateCallBackMap removes the given FID function's function arguments from callback calls list
     * since they will be called directly by this function during its execution 
     * @param {String} fID 
     */
    function validateCallBackMap(fID) {
        if (functionsFuncInput.has(fID)) {
            let argsList = functionsFuncInput.get(fID)
            for (let item of argsList) {
                callbackMap.delete(item)
            }
            functionsFuncInput.delete(fID)
        }
    }

    function getFromCallbackMap(key) {
        return callbackMap.get(key)
    }

    function removeFromCallbackMap(key) {
        return callbackMap.delete(key)
    }

    function getAddedListeners(base, event) {
        let baseEvents = addedListeners.get(base)
        if (baseEvents && baseEvents.has(event)) {
            let info = baseEvents.get(event)
            return [[...info[0]], [...info[1]]]
        }
        return []
    }

    function getID(func, iid) {
        if (functionIDs.has(func)) {
            return functionIDs.get(func)
        }
        let id = 't_' + iid
        functionIDs.set(func, id)
        return id
    }

    function getFunctionName(f, iid) {
        let functionName = f.name
        if (!functionName) {
            if (isMainFile(iid)) {
                functionName = utils.filePathToFileName(mainFilePath)
            } else {
                functionName = "arrowAnonymousFunction"
            }

        }
        return functionName
    }

    function getVarName(name, isGlobal) {
        let ext = isGlobal ? "t" : "f";
        let varName = `${name}-${ext}`
        return varName
    }

    sandbox.analysis = new Analyser();
})(J$);
