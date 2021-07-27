// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');
const events = require('events')


let logger = "";
let mainFileName = "";
let functionEnterStack = [];
let timeoutsQueueMap = new Map();
let accessedFiles = new Map();
let EventEmmiter = events.EventEmitter.prototype;
let addedListeners = new Map();
let emittedEvents = new Map();
const trackExternals = false;

(function (sandbox) {
    sandbox.Config.LOG_ALL_READS_AND_BRANCHES = true
    sandbox.functionIDs = new Map();
    function Analyser() {
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
            let fName = f.name;
            let lineNumber = getLine(iid)

            if (isImportingNewModule(iid)) {
                return { f: f, base: base, args: args, skip: false };
            }

            if (isConstructor) {
                f.isConstructor = true
                log(lineNumber + " class " + fName + "'s constructor is called with variables " + 'args' + " by " + functionEnterStack[functionEnterStack.length - 1].name)

            } else if (isAddEventlistener(f)) {
                addToAddedListener(base, args[0], args[1])

            } else if (isEmitEvent(f)) {
                let callerFunction = functionEnterStack[functionEnterStack.length - 1]
                addToEmittedEvents(base, { 'event': args[0], 'listeners': getAddedListeners(base, args[0]).slice(), 'callerFunction': callerFunction })
                log(lineNumber + " function " + callerFunction.name + " emitted event " + args[0] + " of " + base.constructor.name)
            } else {
                if (isTimeOut(f)) {
                    addToTimeoutMap('t_' + args[0] + Math.max(args[1], 1), lineNumber)
                    fName += lineNumber + getPositionInLine(iid)

                } else if (isImmediate(f)) {
                    addToTimeoutMap('i_' + args[0], lineNumber)
                    fName += lineNumber + getPositionInLine(iid)

                } else if (isInterval(f)) {
                    addToTimeoutMap('v_' + args[0] + args[1], lineNumber)
                    fName += lineNumber + getPositionInLine(iid)

                } else if (isAnonymousFunction(f)) {
                    fName = 'anonymous' + lineNumber + getPositionInLine(iid)
                    f.anonymous_name = fName
                }
                log(lineNumber + " function " + fName + " is called with variables " + 'args' + " by " + functionEnterStack[functionEnterStack.length - 1].name)
            }

            return { f: f, base: base, args: args, skip: false };
        };

        this.functionEnter = function (iid, f, dis, args) {
            // TODO it's not readable => remove these ugly if elses 
            if (isImportingNewModule(iid)) {
                accessedFiles.set(getFilePath(iid), iid)
            } else {
                let fName = f.name;

                if (isMainFile(iid)) {
                    mainFileName = fName = getFileName(iid)
                    accessedFiles.set(fName, iid)
                    functionEnterStack.push({ 'name': fName })
                } else if (f.isConstructor) {
                    log(getLine(iid) + " class " + fName + "'s constructor entered with variables " + 'args from ' + functionEnterStack[functionEnterStack.length - 1].name)

                } else if (isCalledByEvents(dis)) {
                    let event = getRelatedEvent(dis, f)
                    if (fName == "") fName = 'anonymous' + getLine(iid)
                    f.calledByEvent = true;
                    log(getLine(iid) + " function " + fName + " entered with variables " + 'args' + " throught event " + event.event + " emitted by function " + event.callerFunction.name)

                } else {

                    if (isCalledByTimeoutOrInterval(dis)) {
                        if (fName == "") fName = 'anonymous' + getLine(iid)

                        if (isCalledByInterval(dis)) {
                            functionEnterStack.push({ 'name': 'setInterval' + getTimeoutMap('v_' + f + dis._idleTimeout)[0], 'isTimer': true })

                        } else { // if called by timeout
                            functionEnterStack.push({ 'name': 'setTimeOut' + popFromTimeoutMap('t_' + f + dis._idleTimeout), 'isTimer': true })
                        }

                    } else if (isCalledByImmediate(dis)) {
                        functionEnterStack.push({ 'name': 'setImmediate' + popFromTimeoutMap('i_' + f), 'isTimer': true })
                        if (fName == "") fName = 'anonymous' + getLine(iid)

                    } else if (fName == "") {
                        fName = f.anonymous_name
                    }
                    log(getLine(iid) + " function " + fName + " entered with variables " + 'args from ' + functionEnterStack[functionEnterStack.length - 1].name)
                }

                functionEnterStack.push({ 'name': fName, 'object': f })
            }
        };
        {
            // this.getFieldPre = function (iid, base, offset, isComputed, isOpAssign, isMethodCall) {
            //     // console.log("")
            //     // console.log("")
            //     // console.log("")
            //     // console.log("")
            //     // console.log("")
            //     // console.log(getLine(iid))
            //     // console.log(base)
            //     // console.log(isMethodCall)
            //     return { base: base, offset: offset, skip: false };
            // };

            // this.read = function (iid, name, val, isGlobal, isScriptLocal) {
            //     console.log(" * * * * * * * read")
            //     console.log(name)
            //     console.log(val)
            //     console.log(isGlobal)
            // };

            // this.write = function (iid, name, val, lhs, isGlobal, isScriptLocal) {
            //     console.log(" * * * * * * * write")
            //     console.log(name)
            //     console.log(val)
            //     console.log(isGlobal)
            //     console.log(lhs)
            // };
            // this.builtinEnter = function (name, f, dis, args) {
            //     console.log(f)
            // };

            // this.literal = function (iid, val, fakeHasGetterSetter, literalType) {
            //     if (literalType == "FunctionLiteral") {

            //         console.log("litteral")
            //         console.log(getLine(iid))
            //         console.log(val)
            //         console.log(literalType)
            //         console.log(J$.iidToLocation(iid))
            //         val.just_to_check = "sadjad"
            //         val['just_to_check'] = "sadjad"
            //         console.log("")
            //         console.log("")
            //         console.log("")
            //         console.log("")
            //         console.log("")
            //     }
            //     return { result: val };
            // };
            // optional literal type filter: by specifying the types in an array, only given types of literals will be instrumented
            // this.literal.types = ["ObjectLiteral", "ArrayLiteral", "FunctionLiteral", "NumericLiteral", "BooleanLiteral", "StringLiteral",
            //     "NullLiteral", "UndefinedLiteral", "RegExpLiteral"];

            // this.declare =  function (iid, name, type, kind, value) {
            //     console.log(" * * * * * * * declare")
            //     console.log(name)
            //     console.log(type)
            //     console.log(kind)
            //     console.log(value)
            // }
        }
        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            if (!(isImportingNewModule(iid) || isMainFile(iid))) {
                let f = functionEnterStack.pop()
                let caller = functionEnterStack[functionEnterStack.length - 1]
                if (caller.isTimer) {
                    functionEnterStack.pop()
                }

                if (f.object.isConstructor) {
                    log(getLine(iid) + " class " + f.name + "'s constructor exited with return values " + returnVal + " to function " + caller.name);
                } else if (f.object.calledByEvent) {
                    log(getLine(iid) + " function " + f.name + " exited");
                } else {
                    log(getLine(iid) + " function " + f.name + " exited with return values " + returnVal + " to function " + caller.name);
                }
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
        function getFileName(iid) {
            return getFilePath(iid).split('/')[2];
        }

        function getFilePath(iid) {
            return J$.iidToLocation(iid).split(':')[0];
        }
        function getLine(iid) {
            return J$.iidToLocation(iid).split(':')[1]
        }

        function getPositionInLine(iid) {
            return J$.iidToLocation(iid).split(':')[2]
        }

        function isMainFile(iid) {
            return (getLine(iid) == 1 && mainFileName == "") || accessedFiles.get(mainFileName) == iid
        }

        function isImportingNewModule(iid) {
            return (mainFileName != "" && mainFileName != getFileName(iid) && !(accessedFiles.has(getFilePath(iid)) && trackExternals)) || accessedFiles.get(getFilePath(iid)) == iid

        }
        function log(log_value) {
            logger += "\n#" + log_value
        }

        function isTimeOut(func) {
            return func == setTimeout
        }

        function isImmediate(func) {
            return func == setImmediate
        }

        function isInterval(func) {
            return func == setInterval
        }

        function isEmitEvent(func) {
            return func == EventEmmiter.emit
        }

        function isAddEventlistener(func) {
            return [EventEmmiter.addListener, EventEmmiter.once, EventEmmiter.prependListener, EventEmmiter.prependOnceListener].includes(func)
        }

        function isAnonymousFunction(func) {
            return func.name == "";
        }

        function isCalledByImmediate(base) {
            return base._onImmediate
        }

        function isCalledByTimeoutOrInterval(base) {
            return base._onTimeout
        }

        function isCalledByEvents(base) {
            return base.constructor.prototype == EventEmmiter
        }

        function isCalledByInterval(base) {
            return base._repeat
        }

        function addToMapList(map, key, value) {
            if (map.has(key)) {
                map.get(key).push(value)
            } else {
                map.set(key, [value])
            }
        }

        function addToTimeoutMap(key, value) {
            addToMapList(timeoutsQueueMap, key, value)
        }

        function addToEmittedEvents(key, value) {
            addToMapList(emittedEvents, key, value)
        }

        function addToAddedListener(base, event, listener) {
            let baseEvents = addedListeners.get(base)
            if (!baseEvents) {
                addedListeners.set(base, new Map().set(event, [listener]))
            } else {
                addToMapList(baseEvents, event, listener)
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


    }
    sandbox.analysis = new Analyser();
})(J$);
