const path = require('path');
const events = require('events');
const { REPO_PATH, REPO_TEST_RELATIVE_DIR } = require('../constants');
let EventEmmiter = events.EventEmitter.prototype;

(function (sandbox) {
    if (typeof sandbox.Utils !== 'undefined') {
        return;
    }

    var Utils = sandbox.Utils = {};

    Utils.trackExternals = true;

    Utils.getFileName = function (iid) {
        let pathSections = Utils.getFilePath(iid).split('/')
        return pathSections[pathSections.length-1].toLowerCase();
    }

    Utils.getFilePath = function (iid) {
        return J$.iidToLocation(iid).split(':')[0].substring(1);
    }
    Utils.getLine = function (iid) {
        return J$.iidToLocation(iid).split(':')[1]
    }

    Utils.getEndLine = function (iid) {
        return J$.iidToLocation(iid).split(':')[3]
    }

    Utils.getPositionInLine = function (iid) {
        return J$.iidToLocation(iid).split(':')[2]
    }

    Utils.getIIDKey = function (functionName, iid) {
        let locationList = J$.iidToLocation(iid).split(':')
        let filePath = locationList[0].substring(1).replace(REPO_PATH + path.sep, '').toLowerCase() // should get rid of path from the root of the system!
        let line = locationList[1]
        let Endline = locationList[3]
        return `${functionName}-${filePath}-${line}-${Endline}`
    }

    Utils.isTimeOut = function (func) {
        return func == setTimeout
    }

    Utils.isImmediate = function (func) {
        return func == setImmediate
    }

    Utils.isInterval = function (func) {
        return func == setInterval
    }

    Utils.isEmitEvent = function (func) {
        return func == EventEmmiter.emit
    }

    Utils.isAddEventlistener = function (func) {
        return [EventEmmiter.addListener, EventEmmiter.once, EventEmmiter.prependListener, EventEmmiter.prependOnceListener].includes(func)
    }

    Utils.isForEach = function (func) {
        return func == Array.prototype.forEach
    }
    Utils.isAnonymousFunction = function (func) {
        return func.name == "";
    }

    Utils.isCalledByImmediate = function (base) {
        return base!=undefined && base._onImmediate
    }

    Utils.isCalledByTimeoutOrInterval = function (base) {
        return base!=undefined && base._onTimeout
    }

    Utils.isCalledByEvents = function (base) {
        return base!=undefined && base.constructor.prototype == EventEmmiter
    }

    Utils.isCalledByInterval = function (base) {
        return base!=undefined && base._repeat
    }

    Utils.isCalledByTimeout = function (base) {
        return base!=undefined && base._onTimeout && !base._repeat
    }

    Utils.addToMapList = function (map, key, value, distinct) {
        if (map.has(key)) {
            map.get(key).push(value)
            if (distinct) {
                map.set(key, [...new Set(map.get(key))])
            }
        } else {
            map.set(key, [value])
        }
    }

    Utils.isTestFunction = function (iid) {
        let filePath = Utils.getFilePath(iid)
        return filePath.includes(REPO_TEST_RELATIVE_DIR)
    }
})(J$);

