// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const fs = require('fs');
const events = require('events')


let logger = "";
let testName = "";
let functionsIDs = new Map();
let functionEnterStack = [];
let timeoutsQueueMap = new Map();
let accessedFiles = [];
let EventEmmiter = events.EventEmitter.prototype;
let addedEvents = new Map();
let emittedEvents = new Map();

(function (sandbox) {
    sandbox.Config.LOG_ALL_READS_AND_BRANCHES = true
    function Analyser() {
        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod, functionIid, functionSid) {
            let fName = f.name;
            if (isConstructor) {
                f.isConstructor = true
                log(getLine(iid) + " class " + fName + "'s constructor is called with variables " + 'args' + " by " + functionEnterStack[functionEnterStack.length - 1].name)

            } else if (isAddEventlistener(f)) {
                addToAddedListener(base, args[0], args[1])
            } else if (isEmitEvent(f)) {
                addToEmittedEvents(base, { 'event': args[0], 'listeners': getAddedListeners(base, args[0]).slice() })
                log(getLine(iid) + " function " + functionEnterStack[functionEnterStack.length - 1].name + " emitted event " + args[0] + " of " + base.constructor.name)

            } else {
                if (isTimeOut(f)) {
                    addToTimeoutMap('t_' + args[0] + Math.max(args[1], 1), getLine(iid))
                    fName += getLine(iid)
                } else if (isImmediate(f)) {
                    addToTimeoutMap('i_' + args[0], getLine(iid))
                    fName += getLine(iid)
                } else if (isInterval(f)) {
                    addToTimeoutMap('v_' + args[0] + args[1], getLine(iid))
                    fName += getLine(iid)
                } else if (fName == "") {
                    fName = 'anonymous' + getLine(iid) + getPositionInLine(iid)
                    f.anonymous_name = fName
                }
                log(getLine(iid) + " function " + fName + " is called with variables " + 'args' + " by " + functionEnterStack[functionEnterStack.length - 1].name)
            }

            return { f: f, base: base, args: args, skip: false };
        };

        this.functionEnter = function (iid, f, dis, args) {
            // TODO it's not readable => remove these ugly if elses 
            let fName = f.name;

            if (isImportingNewModule(iid)) {
                accessedFiles.push(getFilePath(iid))
                functionsIDs.set(iid, { 'name': getFilePath(iid) })
            } else {
                if (isMainFile(iid)) {
                    testName = fName = getFileName(iid)
                } else if (f.isConstructor) {
                    log(getLine(iid) + " class " + fName + "'s constructor entered with variables " + 'args from ' + functionEnterStack[functionEnterStack.length - 1].name)

                } else if (dis.constructor.prototype == EventEmmiter) {
                    let disEmittedEvents = getEmittedEvents(dis)
                    let event = ""
                    for (let index in disEmittedEvents) {
                        let listeners = disEmittedEvents[index]['listeners']
                        let indexOf = listeners.indexOf(f)
                        if (indexOf != -1) {

                            event = disEmittedEvents[index]['event']
                            listeners.splice(indexOf, 1)
                            if (!listeners.length) {
                                disEmittedEvents.splice(index, 1);
                            }
                            break;
                        }
                    }
                    log(getLine(iid) + " function " + fName + " is called with variables " + 'args' + " by event " + event + ' in function ' + functionEnterStack[functionEnterStack.length - 1].name)
                } else {
                    if (dis._onTimeout) {
                        if (dis._repeat) {
                            functionEnterStack.push({ 'name': 'setInterval' + getTimeoutMap('v_' + f + dis._idleTimeout)[0], 'isTimer': true })
                        } else {
                            functionEnterStack.push({ 'name': 'setTimeOut' + popFromTimeoutMap('t_' + f + dis._idleTimeout), 'isTimer': true })
                        }
                        if (fName == "") {
                            fName = 'anonymous' + getLine(iid)
                        }
                    } else if (dis._onImmediate) {
                        functionEnterStack.push({ 'name': 'setImmediate' + popFromTimeoutMap('i_' + f), 'isTimer': true })
                        if (fName == "") {
                            fName = 'anonymous' + getLine(iid)
                        }
                    } else if (fName == "") {
                        fName = f.anonymous_name
                    }
                    log(getLine(iid) + " function " + fName + " entered with variables " + 'args from ' + functionEnterStack[functionEnterStack.length - 1].name)
                }

                let fInfo = { 'name': fName }
                functionEnterStack.push(fInfo)
                if (f.isConstructor) {
                    fInfo['isConstructor'] = true
                }
                functionsIDs.set(iid, fInfo)
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
                functionEnterStack.pop()
                let caller = 'undefined'
                if (functionEnterStack.length > 0) {
                    caller = functionEnterStack[functionEnterStack.length - 1]
                    if (caller.isTimer) {
                        functionEnterStack.pop()
                    }
                }
                let f = functionsIDs.get(iid)
                if (f.isConstructor) {
                    log(getLine(iid) + " class " + f.name + "'s constructor exited with return values " + returnVal + " to function " + caller.name);
                } else {
                    log(getLine(iid) + " function " + f.name + " exited with return values " + returnVal + " to function " + caller.name);
                }
            }
            return { returnVal: returnVal, wrappedExceptionVal: wrappedExceptionVal, isBacktrack: false };
        };

        this.endExecution = function () {
            log("end Execution");
            // console.log(emittedEvents)
            // console.log(addedEvents)
            fs.writeFileSync(path.join(__dirname, 'test/analyzerOutputs' + path.sep + testName), logger, function (err) {
                if (err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
        };

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
            return (getLine(iid) == 1 && testName == "") || (functionsIDs.has(iid) && testName == functionsIDs.get(iid).name)
        }

        function isImportingNewModule(iid) {
            return (testName != "" && testName != getFileName(iid) && getLine(iid) == 1 && !accessedFiles.includes(getFilePath(iid)) || (functionsIDs.has(iid) && getFilePath(iid) == functionsIDs.get(iid).name))

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
            return func == EventEmmiter.addListener
        }

        function addToMapList(map, key, value) {
            if (map.has(key)) {
                map.get(key).push(value) // line number, args, caller
            } else {
                map.set(key, [value]) // line number, args, caller
            }
        }


        function addToTimeoutMap(key, value) {
            addToMapList(timeoutsQueueMap, key, value)
        }

        function addToEmittedEvents(key, value) {
            addToMapList(emittedEvents, key, value)
        }
        function popFromTimeoutMap(key) {
            if (timeoutsQueueMap.has(key)) {
                return timeoutsQueueMap.get(key).shift() // line number, args, caller
            }
        }

        function getTimeoutMap(key) {
            if (timeoutsQueueMap.has(key)) {
                return timeoutsQueueMap.get(key) // line number, args, caller
            }
        }

        function addToAddedListener(base, event, listener) {
            let baseEvents = addedEvents.get(base)
            if (!baseEvents) {
                addedEvents.set(base, new Map().set(event, [listener])) // line number, args, caller
            } else if (!baseEvents.has(event)) {
                baseEvents.set(event, [listener]) // line number, args, caller
            } else {
                baseEvents.get(event).push(listener) // line number, args, caller
            }
        }

        function getAddedListeners(base, event) {
            // console.log("   ")
            // console.log("   ")
            // console.log(base)
            // console.log(event)
            // console.log(addedEvents)
            // console.log("   ")
            // console.log("   ")
            let baseEvents = addedEvents.get(base)
            if (baseEvents && baseEvents.has(event)) {
                return baseEvents.get(event) // line number, args, caller
            }
        }

        function getEmittedEvents(key) {
            if (emittedEvents.has(key)) {
                return emittedEvents.get(key) // line number, args, caller
            }
        }

        function updateEmittedEvent(base, events) {
            addedEvents.set(base, events) // line number, args, caller
        }
    }
    sandbox.analysis = new Analyser();
})(J$);
