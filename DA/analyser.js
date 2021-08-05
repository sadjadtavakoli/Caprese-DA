// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');
const { type } = require('os');


let logger = "";
let trace = "";
let mainFileName = "";
let functionEnterStack = [];
let timeoutsQueueMap = new Map();
let callbackMap = new Map();
let callbackMapValidator = new Map();
let calledFunctions = [];
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
            // let fName = f.name;
            // let lineNumber = utils.getLine(iid)

            if (isImportingNewModule(iid)) {
                return { f: f, base: base, args: args, skip: false };
            }

            // if (isConstructor) {
            //     f.isConstructor = true
            //     // log(lineNumber + " class " + fName + "'s constructor is called with variables " + 'args' + " by " + functionEnterStack[functionEnterStack.length - 1].name)

            // } else 
            if (utils.isAddEventlistener(f)) {

                addToAddedListener(base, args[0], getID(args[1], iid))

            } else if (utils.isEmitEvent(f)) {

                let callerFunction = functionEnterStack[functionEnterStack.length - 1]
                addToEmittedEvents(base, { 'event': args[0], 'listeners': getAddedListeners(base, args[0]).slice(), 'callerFunction': callerFunction })
                // log(lineNumber + " function " + utils.getLine(callerFunction.id) + " emitted event " + args[0] + " of " + base.constructor.name)

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
                    // validateCallBackMap(fID, callerFunction)
                    // calledFunctions.push(fID)
                    for (let i = 0; i < args.length; i = i + 1) {
                        if (typeof args[i] == "function") {
                            let argID = getID(args[i], iid + `${i}`)
                            // console.log(" - - - - - --call time-- - - - - - - - ")
                            // console.log(argID)
                            // console.log(callerFunction)
                            addToCallbackMap(argID, fID, callerFunction)
                        }
                    }

                    // console.log("function call "  + f + " " + utils.getLine(iid))

                }

                // log(" function called by " + callerFunction.lineNumber)
            }

            return { f: f, base: base, args: args, skip: false };
        };

        this.functionEnter = function (iid, f, dis, args) {
            // TODO it's not readable => remove these ugly if elses 
            if (isImportingNewModule(iid)) {
                accessedFiles.set(utils.getFilePath(iid), iid)
            } else {
                let fID = getID(f, iid)
                tempIDsMap.set(fID, iid)
                if (isMainFile(iid)) {
                    mainFileName = utils.getFileName(iid)
                    accessedFiles.set(mainFileName, iid)
                    // } else if (f.isConstructor) {
                    //     log(utils.getLine(iid) + " class " + f.name + "'s constructor entered from" + utils.getLine(functionEnterStack[functionEnterStack.length - 1].id))

                } else if (utils.isCalledByEvents(dis)) {
                    let event = getRelatedEvent(dis, fID)
                    log(utils.getLine(iid) + " function  " + utils.getLine(iid) + " entered throught event " + event.event + " emitted by function " + event.callerFunction.lineNumber)
                    updateTrace(fID) // can be replaced by iid without any unnecassary complixity 
                } else {
                    console.log("entetr function " + utils.getLine(iid))
                    let callerFunction;
                    if (utils.isCalledByInterval(dis)) {
                        callerFunction = getTimeoutMap('v_' + fID + dis._idleTimeout)[0]
                    } else if (utils.isCalledByImmediate(dis)) {
                        callerFunction = popFromTimeoutMap('i_' + fID)
                    } else if (utils.isCalledByTimeout(dis)) {
                        callerFunction = popFromTimeoutMap('t_' + fID + dis._idleTimeout)
                    } else 
                    // if(!checkBeingCalled(fID)) 
                    { // simple function or callback
                        let argCheck = popFromCallbackMap(fID)
                        if (argCheck) {
                            callerFunction = argCheck
                        }
                    }

                    if (callerFunction) {
                        callerFunction['isTemp'] = true
                        functionEnterStack.push(callerFunction)
                        console.log("* * * * ** * * * enter has parent * * * * * * * **")
                        console.log(callerFunction)
                    } else {
                        console.log("* * * * ** * *  bi pedar madar * * * * * * * **")
                        callerFunction = functionEnterStack[functionEnterStack.length - 1]
                        console.log(callerFunction)
                    }
                    log(utils.getLine(iid) + " function " + utils.getLine(iid) + " entered from " + callerFunction.lineNumber)
                    updateTrace(fID)
                }


                console.log(" /* */ ** /* * * */* /*/ *")
                functionEnterStack.push({ 'lineNumber': utils.getLine(iid), 'fID': fID })
                console.log(functionEnterStack)

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
            fs.writeFileSync(path.join(__dirname, 'test/analyzerOutputs' + path.sep + mainFileName), logger, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
            console.log("**************end execution************")
            for (const [key, value] of tempIDsMap.entries()) {
                trace = trace.replace(new RegExp(key, 'g'), utils.getIddKey(value))
                console.log(key + " : " + utils.getLine(value))
                // console.log(utils.getLine(value))
            }
            console.log(trace)

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

    function isRequire(f) {
        return f.name == require.name && f.constructor == require.constructor
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
        utils.addToMapList(callbackMap, key, caller)
        // utils.addToMapList(callbackMapValidator, key, mainFunction, true)
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

    function getCallbackMap(key) {
        if (callbackMap.has(key)) {
            return callbackMap.get(key)
        }
        return []
    }
    /**
     * in this method we want to check whether our current caller is the one which used function key as input? 
     * if so, we will remove functon key from callbacks' list
     * @param key The function's iD
     * @param caller Our function's caller
     * @returns 
     */
    function validateCallBackMap(key, caller) {
        if (callbackMapValidator.has(key)) {
            let callerIndex = callbackMapValidator.get(key).indexOf(caller)
            if (callerIndex != -1) {
                callbackMapValidator.get(key).splice(callerIndex, callerIndex)
            }
        }
    }

    function checkBeingCalled(key){
        let index = calledFunctions.indexOf(key)
        if(index != -1){
            return calledFunctions.splice(index, index)
        }
    }

    function popFromCallbackMap(key) {
        if (callbackMap.has(key)) {
            // callbackMapValidator.get(key).shift()
            return callbackMap.get(key).shift()
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
