// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');
const { DA_DEPENDENCIES_PATH } = require('./constants')

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
let listOfGlobalVariables = new Map();
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
            if (f == undefined || isImporting(iid)) {
                return { f: f, base: base, args: args, skip: false };
            }

            // The last function of the functionEnterStack is the caller function 
            let callerFunction = getCurrentFunction()
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
            let filePath = utils.getFilePath(iid)
            tempIDsMap[baseID] = fID
            let data = { 'baseID': baseID, 'fID': fID }

            if (isMainFile(iid)) {
                if (mainFilePath == "") {
                    mainFilePath = filePath
                    accessedFiles.set(mainFilePath, { 'iid': iid, 'fID': fID, 'baseID': baseID })
                }
                functionEnterStack.push(data)
            } else if (isImporting(iid)) {
                accessedFiles.set(filePath, { 'iid': iid, 'fID': fID, 'baseID': baseID })
            } else {

                if (!utils.isCalledByCallBackRequiredFunctions(dis)) {
                    removeStoredFuncInputs(fID)
                    if (!isACallBack(f, iid)) {
                        let caller = getCurrentFunction()
                        if (caller == undefined) {
                            caller = accessedFiles.get(filePath)
                        }
                        addImpact(fID, caller.baseID) // adds the caller function to the callee's impact-list 
                        if (args.length) { // adds a function to its caller impact-list if its signature accepts arguments 
                            addImpact(caller.fID, baseID)
                        }
                    }
                }
                functionEnterStack.push(data)
            }
            declarePost(fID, filePath)
        };

        /**
         * These callbacks are called after the execution of a function body.
         **/
        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!(isImporting(iid))) { // new
                let f = functionEnterStack.pop()
                manageVarAccess(f, iid)
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
                let impactedKeys = new Set()
                let impactedIDs = functionsDependency[item]['impacted']
                for (let id of impactedIDs) {
                    if (tempIDsMap[id] != undefined) {
                        impactedKeys.add(tempIDsMap[id])
                    }
                }
                functionsDependency[item]['impacted'] = [...impactedKeys]
            }

            fs.writeFileSync(depdendenciesPath, JSON.stringify(functionsDependency), function (err) {
                if (err) {
                    console.log(err);
                }
                console.log("Dependencies file was saved!");
            });
        };

        let tempDeclarationList = new Map()
        /**
         *  Declaration of a symbol, type can be `const, let, var`
         *  Jalangi version: this.declare = function (iid, name, val, isArgument, argumentIndex, isCatchParam) {
         **/
        this.declare = function (iid, name, type, kind) {
            let location = utils.getLocation(iid)
            if (kind == undefined) {
                if (tempDeclarationList.has(location['filePath'])) {
                    tempDeclarationList.get(location['filePath']).push(getVarDataLinesGiven(name, location['firstLine'], location['lastLine']))
                } else {
                    tempDeclarationList.set(location['filePath'], [getVarDataLinesGiven(name, location['firstLine'], location['lastLine'])])
                }
            }
        };

        /**
         * Records declared variables inside a function after functionEnter method's execution
         * @param fID as a function's ID
         **/
        function declarePost(fID) {
            for (let [filePath, declarationsList] of tempDeclarationList.entries()) {
                let localListOfVariables = listOfVariables.get(filePath)
                for (let variable of declarationsList) {
                    let name = variable['name']
                    let lines = variable['lines']
                    let varData = { "lines": lines, "writers": [fID] }

                    if (localListOfVariables != undefined) {
                        if (localListOfVariables.has(name)) {
                            let declarations = localListOfVariables.get(name)
                            if (declarations.has(fID)) {
                                declarations.get(fID).push(varData)
                            } else {
                                declarations.set(fID, [varData])
                            }
                        } else {
                            let declarationsMap = new Map()
                            declarationsMap.set(fID, [varData])
                            localListOfVariables.set(name, declarationsMap)
                        }
                    } else {
                        localListOfVariables = new Map()
                        let declarationsMap = new Map()
                        declarationsMap.set(fID, [varData])
                        localListOfVariables.set(name, declarationsMap)
                        listOfVariables.set(filePath, localListOfVariables)
                    }

                    if (readAndDeclarations.has(fID)) {
                        let declareds = readAndDeclarations.get(fID)['declareds']
                        if (declareds == undefined) {
                            declareds = new Map()
                            declareds.set(name, [lines])
                            readAndDeclarations.get(fID)['declareds'] = declareds
                        } else if (declareds.has(name)) {
                            declareds.get(name).push(lines)
                        } else {
                            declareds.set(name, [lines])
                        }
                    } else {
                        let declradsMap = new Map()
                        declradsMap.set(name, [lines])
                        readAndDeclarations.set(fID, { 'reads': { true: [], false: [] }, 'declareds': declradsMap })
                    }
                }
            }

            tempDeclarationList = new Map()
        }

        /**
         * This callback is called after a variable is read
         * It also records each function's read and declared variables
         **/
        this.read = function (iid, name, val, isGlobal, isScriptLocal) {
            if (typeof val != "function" && typeof val != "object" && name != "this") {
                let varData = getVarData(name, iid)
                let fID = getCurrentFunction().fID;
                declarePost(fID)
                if (readAndDeclarations.has(fID)) {
                    readAndDeclarations.get(fID)['reads'][isGlobal].push(varData)
                } else {
                    let data = { 'reads': { true: [], false: [] } }
                    data['reads'][isGlobal].push(varData)
                    readAndDeclarations.set(fID, data)
                }

            }
            return { result: val };
        };

        /**
         * This callback is called after a variable is writtern
         * It also keeps a record of each variable's writers
         **/
        this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal) {
            if (typeof val != "function" && typeof val != "object" && name != "this") {
                if (getCurrentFunction() != undefined) {
                    let filePath = utils.getFilePath(iid)
                    let fID = getCurrentFunction().fID;
                    declarePost(fID)
                    if (isGlobal) {
                        let localListOfVariables = listOfGlobalVariables.get(filePath)
                        if (localListOfVariables != undefined) {
                            let writings = localListOfVariables.get(name)
                            if (writings != undefined) {
                                if (!writings.includes(fID)) writings.push(fID)
                            } else {
                                localListOfVariables.set(name, [fID])
                            }
                        } else {
                            let localListOfVariables = new Map()
                            localListOfVariables.set(name, [fID])
                            listOfGlobalVariables.set(filePath, localListOfVariables)
                        }
                    } else {
                        let localListOfVariables = listOfVariables.get(filePath)
                        let varData = getVarData(name, iid)
                        let closestDeclaration = getClosestDeclaration(localListOfVariables, varData, fID);
                        if (closestDeclaration != undefined && !closestDeclaration.includes(fID)) closestDeclaration.push(fID);
                    }
                }
            }
            return { result: val };
        };

        /**
         * This method is called at the end of functionExit
         * It updates each functions dependencies based on its read/declared variables
         * At the end it deletes any unnecessary data related to them
         **/
        function manageVarAccess(f, iid) {
            let filePath = utils.getFilePath(iid)
            let localListOfVariables = listOfVariables.get(filePath)
            let fID = f.fID
            if (readAndDeclarations.has(fID)) {
                let accessedVars = readAndDeclarations.get(fID)
                let reads = accessedVars['reads'][false]
                let declareds = accessedVars['declareds']
                declareds = declareds != undefined ? declareds : new Map()
                let readsGlobals = accessedVars['reads'][true]

                let allWriters = []
                for (let varData of reads) {
                    let name = varData['name']
                    let lines = varData['lines']
                    if (!declareds.has(name) || !isDeclared(declareds, name, lines)) {
                        let writers = getClosestDeclaration(localListOfVariables, varData, fID)
                        if (writers != undefined) allWriters = allWriters.concat(writers)
                    }
                }
                let localListOfGlobalVariables = listOfGlobalVariables.get(filePath)
                if (localListOfGlobalVariables != undefined) {
                    for (let varData of readsGlobals) {
                        let name = varData['name']
                        let writers = localListOfGlobalVariables.get(name)
                        if (writers != undefined) {
                            allWriters = allWriters.concat(writers)
                        }
                    }
                }

                readAndDeclarations.delete(fID)

                for (let writer of allWriters) {
                    addImpact(writer, f.baseID)
                }
            }


            function isDeclared(declarations, name, lines) {
                let locations = declarations.get(name);
                for (let location of locations) {
                    if (firstNestedBySecond(lines, location)) {
                        return true;
                    }
                }
                return false;
            }
        }

        /**
         * This callback is called before a property of an object is accessed
         * For each non-function property, it adds the current function to all
         * of its writers' impact set. 
         **/
        this.getField = function (iid, base, offset, val, isComputed, isOpAssign, isMethodCall) {
            if (typeof val != "function" && typeof val != "object" && offset != undefined) {
                if (getCurrentFunction() != undefined) {
                    let baseID = getCurrentFunction().baseID
                    let key = offset.toString() + getSetBaseID(base, "b" + iid);
                    if (fields.has(key)) {
                        for (let writer of fields.get(key)) {
                            addImpact(writer, baseID)
                        }
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
                let fID = getCurrentFunction().fID
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

    function firstNestedBySecond(lines, location) {
        return lines['firstLine'] >= location['firstLine'] && lines['lastLine'] <= location['lastLine'];
    }

    function getClosestDeclaration(localListOfVariables, varData, fID) {
        let varName = varData['name']
        let lines = varData['lines']
        let declrations = localListOfVariables.get(varName);
        if (declrations != undefined && (!declrations.has(fID) || !isDeclared(declrations, fID, lines))) {
            let closest = { 'writers': undefined };
            let minDif = Infinity;
            let currentFirstLine = lines['firstLine'];
            let currentLastLine = lines['lastLine'];

            for (let declaredfID of declrations.values()) {
                for (let item of declaredfID) {
                    let itemLines = item['lines']
                    let firstLine = itemLines['firstLine']
                    let lastLine = itemLines['lastLine']
                    if (firstLine <= currentFirstLine && lastLine >= currentLastLine && (lastLine - firstLine) < minDif) {
                        minDif = (lastLine - firstLine)
                        closest = item;
                    }
                }
            }
            return closest['writers']
        }

        function isDeclared(declarations, fID, lines) {
            let fDeclarations = declarations.get(fID);
            for (let fDeclaration of fDeclarations) {
                let location = fDeclaration['lines']
                if (firstNestedBySecond(lines, location)) {
                    return true;
                }
            }
            return false;
        }
    }

    function getCurrentFunction() {
        return functionEnterStack[functionEnterStack.length - 1]
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

    function getVarData(name, iid) {
        return { "name": name, "lines": utils.getLines(iid) }
    }

    function getVarDataLinesGiven(name, firstLine, lastLine) {
        return { "name": name, "lines": { "firstLine": firstLine, "lastLine": lastLine } }

    }
    sandbox.analysis = new Analyser();
})(J$);
