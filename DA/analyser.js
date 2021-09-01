// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');
const { DA_DEPENDENCIES_PATH, DA_CALL_SEQUENCE_PATH, KEEP_READABLE_TRACE_LOG } = require('../constants')

let logger = "";
let trace = "";
let mainFileName = "";
let functionEnterStack = [];
let timeoutsQueueMap = new Map();
let callbackMap = new Map();
let functionsFuncInput = new Map();
let accessedFiles = new Map();
let addedListeners = new Map();
let emittedEvents = new Map();
let functionIDs = new Map();
let IDsFunction = new Map();
let functionsDependency = {}
let tempIDsMap = {};

(function (sandbox) {
    let utils = sandbox.Utils;
    function Analyser() {
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
            if (isImportingNewModule(iid)) {
                return { f: f, base: base, args: args, skip: false };
            }

            if (utils.isAddEventlistener(f)) {
                //  we should keep these ones as well
                let callerFunction = functionEnterStack[functionEnterStack.length - 1]
                let listenerID = getID(args[1], iid)
                addToAddedListener(getID(base, "b" + iid), args[0], listenerID)
                addDependency(listenerID, callerFunction)
                if(!tempIDsMap[listenerID]) tempIDsMap[listenerID] = utils.getIIDKey(getFunctionName(args[1]), iid)

            } else if (utils.isEmitEvent(f)) {

                let callerFunction = functionEnterStack[functionEnterStack.length - 1]
                let baseID = getID(base, "b" + iid)
                addToEmittedEvents(baseID, { 'event': args[0], 'listeners': getAddedListeners(baseID, args[0]).slice(), 'callerFunction': callerFunction })

            } else {

                let callerFunction = functionEnterStack[functionEnterStack.length - 1]

                if (utils.isTimeOut(f)) {
                    let argID = getID(args[0], iid)
                    addToTimeoutMap('t_' + argID + Math.max(args[1], 1), callerFunction)

                } else if (utils.isImmediate(f)) {
                    let argID = getID(args[0], iid)
                    addToTimeoutMap('i_' + argID, callerFunction)

                } else if (utils.isInterval(f)) {
                    let argID = getID(args[0], iid)
                    addToTimeoutMap('v_' + argID + args[1], callerFunction)
                } else if (utils.isForEach(f)) {
                    let argID = getID(args[0], iid)
                    addToForloopMap(argID, callerFunction, base.length)
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
            // TODO it's not understandable => remove these ugly if elses
            if (isImportingNewModule(iid)) {
                accessedFiles.set(utils.getFilePath(iid), iid)
            } else {
                let fID = getID(f, iid)
                let functionName = getFunctionName(f)
                tempIDsMap[fID] = utils.getIIDKey(functionName, iid)

                if (isMainFile(iid)) {
                    mainFileName = utils.getFileName(iid)
                    accessedFiles.set(mainFileName, iid)

                } else if (utils.isCalledByEvents(dis)) {
                    let event = getRelatedEvent(getID(dis), fID)

                    let callerFunctionName = getFunctionNameFID(event.callerFunction.fID)
                    log(utils.getLine(iid) + " function  " + utils.getIIDKey(functionName, iid) + " entered throught event " + event.event + " emitted by function " + utils.getIIDKey(callerFunctionName, event.callerFunction.iid))
                    addDependency(fID, event.callerFunction)
                    updateTrace(utils.getIIDKey(functionName, iid))
                } else {
                    let callerFunction;
                    if (utils.isCalledByInterval(dis)) {
                        callerFunction = getTimeoutMap('v_' + fID + dis._idleTimeout)[0]
                    } else if (utils.isCalledByImmediate(dis)) {
                        callerFunction = popFromTimeoutMap('i_' + fID)
                    } else if (utils.isCalledByTimeout(dis)) {
                        callerFunction = popFromTimeoutMap('t_' + fID + dis._idleTimeout)
                    } else { // callback
                        validateCallBackMap(fID)
                        let argCheck = popFromCallbackMap(fID)
                        if (argCheck) {
                            callerFunction = argCheck[1]
                        }
                    }
                    if (callerFunction) {
                        callerFunction['isTemp'] = true
                        functionEnterStack.push(callerFunction)
                    } else {
                        callerFunction = functionEnterStack[functionEnterStack.length - 1]
                    }
                    let callerFunctionName = getFunctionNameFID(callerFunction.fID)
                    log(utils.getLine(iid) + " function " + utils.getIIDKey(functionName, iid) + " entered from " + utils.getIIDKey(callerFunctionName, callerFunction.iid))
                    addDependency(fID, callerFunction)
                    updateTrace(utils.getIIDKey(functionName, iid))
                }

                functionEnterStack.push({ 'iid': iid, 'fID': fID })

            }
        };

        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!(isImportingNewModule(iid) || isMainFile(iid))) {
                functionEnterStack.pop()
                let callerFunction = functionEnterStack[functionEnterStack.length - 1]
                if (callerFunction.isTemp) {
                    functionEnterStack.pop()
                }
            }

            return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false };
        };

        this.endExecution = function () {
            log("end Execution");
            if (KEEP_READABLE_TRACE_LOG || process.argv[2]) {
                fs.writeFileSync(path.join(__dirname, 'test' + path.sep + 'analyzerOutputs' + path.sep + mainFileName), logger, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    console.log("The file was saved!");
                });
            }
            let callSequencesPath;
            let depdendenciesPath;
            if (!process.argv[2]) {

                callSequencesPath = DA_CALL_SEQUENCE_PATH;
                depdendenciesPath = DA_DEPENDENCIES_PATH

            } else {
                let callSeqDir = path.join(__dirname, 'test' + path.sep + 'analyzerOutputs' + path.sep + 'traces')
                let depDir = path.join(__dirname, 'test' + path.sep + 'analyzerOutputs' + path.sep + 'dependencies')
                if (!fs.existsSync(callSeqDir)) {
                    fs.mkdirSync(callSeqDir);
                    fs.mkdirSync(depDir);
                }
                callSequencesPath = path.join(callSeqDir + path.sep + mainFileName)
                depdendenciesPath = path.join(depDir + path.sep + mainFileName)
            }

            fs.writeFileSync(callSequencesPath, trace, function (err) {
                if (err) {
                    console.log(err);
                }
                console.log("Traces file was saved!");
            });

            let functionDependenciesByKeys = {}
            for (const item in functionsDependency) {
                let key = tempIDsMap[item]
                functionDependenciesByKeys[key] = { 'callers': [...functionsDependency[item]['callers']], 'tests': [...functionsDependency[item]['tests']] }
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
        return (utils.getLine(iid) == 1 && mainFileName == "") || accessedFiles.get(mainFileName) == iid
    }

    function isImportingNewModule(iid) {
        return (mainFileName != "" && mainFileName != utils.getFileName(iid) && !(accessedFiles.has(utils.getFilePath(iid)) && utils.trackExternals)) || accessedFiles.get(utils.getFilePath(iid)) == iid
    }

    function log(log_value) {
        if (KEEP_READABLE_TRACE_LOG)
            logger += "\n#" + log_value
    }

    function updateTrace(key) {
        trace += key + " -1 "
    }

    function addToTimeoutMap(key, value) {
        utils.addToMapList(timeoutsQueueMap, key, value)
    }

    function addToEmittedEvents(key, value) {
        utils.addToMapList(emittedEvents, key, value)
    }

    /**
     * 
     * @param key parameter function's id
     * @param mainFunction function which we are calling this method on its parameters
     * @param caller mainFunction's caller function
     */
    function addToCallbackMap(key, mainFunction, caller) {
        utils.addToMapList(callbackMap, key, [mainFunction, caller])
    }

    function addToFunctionsFuncInputs(key, list) {
        if (functionsFuncInput.has(key)) {
            functionsFuncInput.get(key).concat(list)
        } else {
            functionsFuncInput.set(key, list)
        }
    }

    function addToForloopMap(key, value, count) { // should edit
        for (let i = 0; i < count; i = i + 1) {
            utils.addToMapList(callbackMap, key, value)
        }
    }

    function addToAddedListener(baseID, event, listener) {
        let baseEvents = addedListeners.get(baseID)
        if (!baseEvents) {
            addedListeners.set(baseID, new Map().set(event, new Set([listener])))
        } else if (!baseEvents.has(event)) {
            baseEvents.set(event, new Set([listener]))
        } else {
            baseEvents.get(event).add(listener)

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

    function popFromTimeoutMap(key) {
        if (timeoutsQueueMap.has(key)) {
            return timeoutsQueueMap.get(key).shift()
        }
    }

    function getTimeoutMap(key) {
        if (timeoutsQueueMap.has(key)) {
            return timeoutsQueueMap.get(key)
        }
        return []
    }

    function validateCallBackMap(enteredFunction) {
        if (functionsFuncInput.has(enteredFunction)) {
            let argsList = functionsFuncInput.get(enteredFunction)
            for (let item of argsList) {
                callbackMap.set(item, callbackMap.get(item).filter(function (ele) {
                    return ele[0] != enteredFunction;
                }))
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

    function getEmittedEvents(key) {
        if (emittedEvents.has(key)) {
            return emittedEvents.get(key)
        }
        return []
    }

    function getRelatedEvent(baseID, func) {
        let baseEmittedEvents = getEmittedEvents(baseID)
        let eventInfo = {}
        for (let index in baseEmittedEvents) {
            let listeners = baseEmittedEvents[index]['listeners']
            let indexOf = listeners.indexOf(func)
            if (indexOf != -1) {

                eventInfo = baseEmittedEvents[index]
                listeners.splice(indexOf, 1)
                if (!listeners.length) {
                    baseEmittedEvents.splice(index, 1);
                }
                break;
            }
        }
        return eventInfo
    }

    function getAddedListeners(base, event) {
        let baseEvents = addedListeners.get(base)
        if (baseEvents && baseEvents.has(event)) {
            return [...baseEvents.get(event)]
        }
        return []
    }

    function getID(func, iid) {
        if (functionIDs.has(func)) {
            return functionIDs.get(func)
        }
        let id = 't_' + iid
        functionIDs.set(func, id)
        IDsFunction.set(id, func)
        return id
    }

    function getFunctionName(f) {
        let functionName = f.name
        if (!functionName) functionName = "arrowFunction"
        return functionName
    }

    function getFunctionNameFID(fID) {
        let f = IDsFunction.get(fID)
        return getFunctionName(f)
    }

    sandbox.analysis = new Analyser();
})(J$);
