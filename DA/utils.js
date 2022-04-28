// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
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

    Utils.filePathToFileName = function (filePath) {
        let pathSections = filePath.split('/')
        return pathSections[pathSections.length - 1].toLowerCase();
    }

    Utils.getIIDFileName = function (iid) {
        return Utils.filePathToFileName(Utils.getFilePath(iid))
    }

    Utils.getFilePath = function (iid) {
        return J$.iidToLocation(iid).split(':')[0].substring(1);
    }
    Utils.getLine = function (iid) {
        return J$.iidToLocation(iid).split(':')[1]
    }

    Utils.getIIDKey = function (functionName, iid) {
        let locationList = J$.iidToLocation(iid).split(':')
        let filePath = locationList[0].substring(1).replace(REPO_PATH + path.sep, '').toLowerCase() // should get rid of path from the root of the system!
        let line = locationList[1]
        let Endline = locationList[3]
        return `${functionName}-${filePath}-${line}-${Endline}`
    }

    Utils.isEmitEvent = function (func) {
        return func == EventEmmiter.emit
    }

    Utils.isAddEventlistener = function (func) {
        return [EventEmmiter.addListener, EventEmmiter.once, EventEmmiter.prependListener, EventEmmiter.prependOnceListener].includes(func)
    }

    Utils.isCallBackRequiredFunction = function (func) {
        let arrayCallBackFunctions = [Array.prototype.every, 
            Array.prototype.some, 
            Array.prototype.forEach, 
            Array.prototype.map, 
            Array.prototype.filter, 
            Array.prototype.reduce,
            Array.prototype.reduceRight,
            setTimeout, setImmediate, setInterval]
        return arrayCallBackFunctions.includes(func)
        
    }

    Utils.isCalledByCallBackRequiredFunctions = function (base) {
        return base!=undefined && (base._onImmediate || base._onTimeout || base.constructor.prototype == EventEmmiter || base._repeat)
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

