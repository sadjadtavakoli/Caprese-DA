// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');


let logger = "";
let mainFileName = "";
let functionEnterStack = [];
let timeoutsQueueMap = new Map();
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
            let fName = f.name;
            let lineNumber = utils.getLine(iid)

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
                }else{
                    getID(f, iid)
                }
                
                // log(lineNumber + " function called by " + utils.getLine(callerFunction.id))
            }

            return { f: f, base: base, args: args, skip: false };
        };

        this.functionEnter = function (iid, f, dis, args) {
            // TODO it's not readable => remove these ugly if elses 
            if (isImportingNewModule(iid)) {
                accessedFiles.set(utils.getFilePath(iid), iid)
            } else {
                if (isMainFile(iid)) {
                    mainFileName = utils.getFileName(iid)
                    accessedFiles.set(mainFileName, iid)
                    getID(f, iid)
        
                // } else if (f.isConstructor) {
                //     log(utils.getLine(iid) + " class " + f.name + "'s constructor entered from" + utils.getLine(functionEnterStack[functionEnterStack.length - 1].id))

                } else if (utils.isCalledByEvents(dis)) {
                    let fID = getID(f)
                    let event = getRelatedEvent(dis, fID)
                    tempIDsMap.set(fID, iid)
                    log(utils.getLine(iid) + " function  " + utils.getLine(iid) + " entered throught event " + event.event + " emitted by function " + event.callerFunction.lineNumber)

                } else {

                    if (utils.isCalledByTimeoutOrInterval(dis) || utils.isCalledByImmediate(dis)) {
                        let fID = getID(f)
                        let callerFunction;
                        tempIDsMap.set(fID, iid)

                        if (utils.isCalledByInterval(dis)) {
                            callerFunction = getTimeoutMap('v_' + fID + dis._idleTimeout)[0]

                        } else if (utils.isCalledByImmediate(dis)){ 
                            callerFunction = popFromTimeoutMap('i_' + fID)
                        }else { // if called by timeout
                            callerFunction = popFromTimeoutMap('t_' + fID + dis._idleTimeout)
                        }

                        callerFunction['isTimer'] = true
                        functionEnterStack.push(callerFunction)

                    }
                    log(utils.getLine(iid) + " function " + utils.getLine(iid) + " entered from " + functionEnterStack[functionEnterStack.length - 1].lineNumber)
                }

                functionEnterStack.push({ 'lineNumber': utils.getLine(iid), 'object': f})

            }
        };

        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!(isImportingNewModule(iid) || isMainFile(iid))) {
                let f = functionEnterStack.pop()
                let caller = functionEnterStack[functionEnterStack.length - 1]
                if (caller.isTimer) {
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
            console.log("slm")
            console.log(functionIDs)

            for(let item in functionIDs){
                console.log(functionIDs[item])
            }
            for(let item in IDsFunction){
                console.log(IDsFunction.get(item))
            }
            
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

    {
        function isMainFile(iid) {
            return (utils.getLine(iid) == 1 && mainFileName == "") || accessedFiles.get(mainFileName) == iid
        }

        function isImportingNewModule(iid) {
            return (mainFileName != "" && mainFileName != utils.getFileName(iid) && !(accessedFiles.has(utils.getFilePath(iid)) && utils.trackExternals)) || accessedFiles.get(utils.getFilePath(iid)) == iid

        }

        function isRequire(f){
            return f.name == require.name && f.constructor == require.constructor
        }

        function log(log_value) {
            logger += "\n#" + log_value
        }

        function addToTimeoutMap(key, value) {
             utils.addToMapList(timeoutsQueueMap, key, value)
        }

        function addToEmittedEvents(key, value) {
             utils.addToMapList(emittedEvents, key, value)
        }

        function addToAddedListener(base, event, listener) { // TODO Listener should be ID instead of actual function
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

        function setID(func, iid){
            functionIDs.set(func, iid)
            IDsFunction.set(id, func)
        }
        function getID(func, iid){
            if(functionIDs.has(func)){
                return functionIDs.get(func)
            }
            let id  = 't_' + iid
            functionIDs.set(func, id)
            IDsFunction.set(id, func)
            return id
        }
    }
    sandbox.analysis = new Analyser();
})(J$);
