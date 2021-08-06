// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');


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
let tempIDsMap = new Map();

(function (sandbox) {
    let utils = sandbox.Utils;
    sandbox.functionIDs = new Map();
    function Analyser() {
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {

            if (isImportingNewModule(iid)) {
                return { f: f, base: base, args: args, skip: false };
            }

            if (utils.isAddEventlistener(f)) {

                addToAddedListener(base, args[0], getID(args[1], iid))

            } else if (utils.isEmitEvent(f)) {

                let callerFunction = functionEnterStack[functionEnterStack.length - 1]
                addToEmittedEvents(base, { 'event': args[0], 'listeners': getAddedListeners(base, args[0]).slice(), 'callerFunction': callerFunction })

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
                tempIDsMap.set(fID, iid)
                if (isMainFile(iid)) {
                    mainFileName = utils.getFileName(iid)
                    accessedFiles.set(mainFileName, iid)
                } else if (utils.isCalledByEvents(dis)) {
                    let event = getRelatedEvent(dis, fID)
                    log(utils.getLine(iid) + " function  " + utils.getLine(iid) + " entered throught event " + event.event + " emitted by function " + event.callerFunction.lineNumber)
                    updateTrace(fID)
                } else {
                    let callerFunction;
                    if (utils.isCalledByInterval(dis)) {
                        callerFunction = getTimeoutMap('v_' + fID + dis._idleTimeout)[0]
                    } else if (utils.isCalledByImmediate(dis)) {
                        callerFunction = popFromTimeoutMap('i_' + fID)
                    } else if (utils.isCalledByTimeout(dis)) {
                        callerFunction = popFromTimeoutMap('t_' + fID + dis._idleTimeout)
                    } else { // simple function or callback
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
                    log(utils.getLine(iid) + " function " + utils.getLine(iid) + " entered from " + callerFunction.lineNumber)
                    updateTrace(fID)
                }

                functionEnterStack.push({ 'lineNumber': utils.getLine(iid), 'fID': fID })

            }
        };

        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!(isImportingNewModule(iid) || isMainFile(iid))) {
                let f = functionEnterStack.pop()
                let caller = functionEnterStack[functionEnterStack.length - 1]
                if (caller.isTemp) {
                    functionEnterStack.pop()
                }
                log(utils.getLine(iid) + " function " + f.lineNumber + " exited to function " + caller.lineNumber);
            }

            return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false };
        };

        this.endExecution = function () {
            log("end Execution");
            fs.writeFileSync(path.join(__dirname, 'test' + path.sep + 'analyzerOutputs' + path.sep + mainFileName), logger, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
            // console.log("**************end execution************")
            for (const [key, value] of tempIDsMap.entries()) {
                trace = trace.replace(new RegExp(key, 'g'), utils.getIddKey(value))
                //     console.log(key + " : " + utils.getLine(value))
                //     // console.log(utils.getLine(value))
            }


            fs.writeFileSync(path.join(__dirname, 'test' + path.sep + 'analyzerOutputs' + path.sep + 'traces' + path.sep + mainFileName), trace, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });

        };

        function getRelatedEvent(base, func) {
            let baseEmittedEvents = getEmittedEvents(base)
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
    }

    function isMainFile(iid) {
        return (utils.getLine(iid) == 1 && mainFileName == "") || accessedFiles.get(mainFileName) == iid
    }

    function isImportingNewModule(iid) {
        return (mainFileName != "" && mainFileName != utils.getFileName(iid) && !(accessedFiles.has(utils.getFilePath(iid)) && utils.trackExternals)) || accessedFiles.get(utils.getFilePath(iid)) == iid

    }

    function log(log_value) {
        logger += "\n#" + log_value
    }

    function updateTrace(fID) {
        trace += fID + " -1 "
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

    function addToAddedListener(base, event, listener) {
        let baseEvents = addedListeners.get(base)
        if (!baseEvents) {
            addedListeners.set(base, new Map().set(event, [listener]))
        } else {
            utils.addToMapList(baseEvents, event, listener)
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

    function getAddedListeners(base, event) {
        let baseEvents = addedListeners.get(base)
        if (baseEvents && baseEvents.has(event)) {
            return baseEvents.get(event)
        }
        return []
    }

    function setID(func, iid) {
        functionIDs.set(func, iid)
        IDsFunction.set(id, func)
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
    sandbox.analysis = new Analyser();
})(J$);
