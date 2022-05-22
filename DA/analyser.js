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
let functionNCallerStack = [];
let functionsDependency = {}
let tempIDsMap = {};

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
        this.invokeFunPre = function (iid, f, base, args) {
            if (isImporting(iid)) {
                return { f: f, base: base, args: args, skip: false };
            }

            let callerFunction = functionEnterStack[functionEnterStack.length - 1]
            if (utils.isAddEventlistener(f)) {
                let listenerID = getID(args[1], iid)

                addToAddedListener(getID(base, "b" + iid), args[0], listenerID, callerFunction.fID)
                if (!tempIDsMap[listenerID]) tempIDsMap[listenerID] = utils.getIIDKey(getFunctionName(args[1], iid), iid)

            } else if (utils.isEmitEvent(f)) {
                let baseID = getID(base, "b" + iid)
                let eventInfo = getAddedListeners(baseID, args[0])
                if (eventInfo.length) {
                    let listeners = eventInfo[0]
                    let setters = eventInfo[1]

                    setters.forEach(setter => {
                        addDependency(setter, callerFunction)
                    })

                    listeners.forEach(listener => {
                        addDependency(listener, callerFunction)
                    })
                }
            } else {
                if (utils.isCallBackRequiredFunction(f)) {
                    addDependency(getID(args[0], iid), callerFunction)
                } else {
                    let fID = getID(f, iid)
                    let funcArgs = []
                    for (let i = 0; i < args.length; i = i + 1) {
                        if (typeof args[i] == "function") {
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

        this.functionEnter = function (iid, f, dis, args) {
            let fID = getID(f, iid)
            if (isMainFile(iid)) {
                if (mainFilePath == "") {
                    mainFilePath = utils.getFilePath(iid)
                    accessedFiles.set(mainFilePath, iid)
                    tempIDsMap[fID] = utils.getIIDKey(utils.getIIDFileName(iid), iid)
                }
                functionEnterStack.push({ 'iid': iid, 'fID': fID })
            } else if (isImporting(iid)) {
                tempIDsMap[fID] = utils.getIIDKey(utils.getIIDFileName(iid), iid)
                accessedFiles.set(utils.getFilePath(iid), iid)
            } else {
                let functionName = getFunctionName(f, iid)
                tempIDsMap[fID] = utils.getIIDKey(functionName, iid)
                let data = { 'iid': iid, 'fID': fID }

                if (!utils.isCalledByCallBackRequiredFunctions(dis)) {
                    validateCallBackMap(fID)
                    let argCheck = popFromCallbackMap(fID)
                    let caller;
                    if (argCheck) {
                        caller = argCheck[1]
                    } else {
                        caller = functionEnterStack[functionEnterStack.length - 1]
                    }
                    if (args.length) {
                        addDependency(caller.fID, { 'iid': iid, 'fID': fID })
                    }
                    functionNCallerStack.push([fID, caller])
                    data.isRegularCall = true
                }

                functionEnterStack.push(data)
            }
        };

        this._return = function (iid, val) {
            let fCaller = functionNCallerStack[functionNCallerStack.length-1]
            let fID = fCaller[0]
            let caller = fCaller[1]
            addDependency(fID, caller)
        };

        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!(isImporting(iid) || isMainFile(iid))) {
                let call = functionEnterStack.pop()
                if(call.isRegularCall){
                    functionNCallerStack.pop()
                }
            }
            return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false };
        };

        this.endExecution = function () {
            const mainFileName = utils.filePathToFileName(mainFilePath);
            let depdendenciesPath;
            if (!process.argv[2]) {
                depdendenciesPath = DA_DEPENDENCIES_PATH
            } else {
                let depDir = path.join(__dirname, 'test' + path.sep + 'analyzerOutputs' + path.sep + 'dependencies')
                if (!fs.existsSync(depDir)) {
                    fs.mkdirSync(depDir);
                }
                depdendenciesPath = path.join(depDir + path.sep + mainFileName + ".json")
            }

            let functionDependenciesByKeys = {}
            for (const item in functionsDependency) {
                let mappedKey = tempIDsMap[item]
                functionDependenciesByKeys[mappedKey] = { 'callers': [...functionsDependency[item]['callers']], 'tests': [...functionsDependency[item]['tests']] }
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
    }

    function isMainFile(iid) {
        return (utils.getLine(iid) == 1 && mainFilePath == "") || accessedFiles.get(mainFilePath) == iid
    }

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
        if (callbackMap.has(key)) {
            callbackMap.get(key).push([mainFunction, caller])
        } else {
            callbackMap.set(key, [[mainFunction, caller]])
        }
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

    function addDependency(calleeFID, caller) {
        if (!functionsDependency[calleeFID]) {
            functionsDependency[calleeFID] = { 'tests': new Set([]), 'callers': new Set([]) }
        }
        let callerFID = caller.fID
        let callerIID = caller.iid
        if (utils.isTestFunction(callerIID)) {
            functionsDependency[calleeFID]['tests'].add(callerFID)
        } else {
            functionsDependency[calleeFID]['callers'].add(callerFID)
        }
    }

    function validateCallBackMap(enteredFunction) {
        if (functionsFuncInput.has(enteredFunction)) {
            let argsList = functionsFuncInput.get(enteredFunction)
            for (let item of argsList) {
                let itemMap = callbackMap.get(item)
                if (itemMap) {
                    callbackMap.set(item, itemMap.filter(ele => {
                        return ele[0] != enteredFunction;
                    }))
                }
            }
            functionsFuncInput.delete(enteredFunction)
        }
    }

    function popFromCallbackMap(key) {
        if (callbackMap.has(key)) {
            let res = callbackMap.get(key).shift()
            if (!callbackMap.get(key).length)
                callbackMap.delete(key)
            return res
        }
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

    sandbox.analysis = new Analyser();
})(J$);
