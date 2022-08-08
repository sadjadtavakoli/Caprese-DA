// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
const path = require('path');
const events = require('events');
const { REPO_PATH } = require('../constants');
const CALLBACK_REQUIRED_FUNCTIONS =
    [Array.prototype.every,
    Array.prototype.some,
    Array.prototype.forEach,
    Array.prototype.map,
    Array.prototype.filter,
    Array.prototype.reduce,
    Array.prototype.reduceRight,
        setTimeout,
        setImmediate,
        setInterval];

const EventEmmiter = events.EventEmitter.prototype;
const EVENT_LISTENER_FUNCTIONS = [EventEmmiter.addListener, EventEmmiter.once, EventEmmiter.prependListener, EventEmmiter.prependOnceListener];

(function (sandbox) {
    if (typeof sandbox.Utils !== 'undefined') {
        return;
    }

    var Utils = sandbox.Utils = {};

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
        return EVENT_LISTENER_FUNCTIONS.includes(func)
    }

    Utils.isCallBackRequiredFunction = function (func) {
        return CALLBACK_REQUIRED_FUNCTIONS.includes(func)
    }

    Utils.isSetImmediate = function (func) {
        return func == setImmediate
    }

    Utils.isSetInterval = function (func) {
        return func == setInterval
    }

    Utils.isSetTimeout = function (func) {
        return func == setTimeout
    }

    Utils.isTimingFunction = function (func) {
        return TIMING_FUNCTIONS.includes(func)
    }

    /**
     * @param base from Analyzer's functionEnter method 
     * @returns True if it's a timing or regular event
     */
     Utils.isCalledByCallBackRequiredFunctions = function (base) {
        return base != undefined && (base._onImmediate || base._onTimeout || (base.constructor && base.constructor.prototype == EventEmmiter) || base._repeat)
    }

})(J$);

