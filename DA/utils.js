const path = require('path');
const events = require('events');
let EventEmmiter = events.EventEmitter.prototype;

(function (sandbox) {
    if (typeof sandbox.Utils !== 'undefined') {
        return;
    }

    var Utils = sandbox.Utils = {};

    Utils.trackExternals = true;

    Utils.getFileName = function(iid) {
        return Utils.getFilePath(iid).split('/')[2];
    }

    Utils.getFilePath = function(iid) {
        return J$.iidToLocation(iid).split(':')[0];
    }
    Utils.getLine = function(iid) {
        return J$.iidToLocation(iid).split(':')[1]
    }

    Utils.getPositionInLine = function(iid) {
        return J$.iidToLocation(iid).split(':')[2]
    }

    Utils.isTimeOut = function(func) {
        return func == setTimeout
    }

    Utils.isImmediate = function(func) {
        return func == setImmediate
    }

    Utils.isInterval = function(func) {
        return func == setInterval
    }

    Utils.isEmitEvent = function(func) {
        return func == EventEmmiter.emit
    }

    Utils.isAddEventlistener = function(func) {
        return [EventEmmiter.addListener, EventEmmiter.once, EventEmmiter.prependListener, EventEmmiter.prependOnceListener].includes(func)
    }

    Utils.isAnonymousFunction = function(func) {
        return func.name == "";
    }

    Utils.isCalledByImmediate = function(base) {
        return base._onImmediate
    }

    Utils.isCalledByTimeoutOrInterval = function(base) {
        return base._onTimeout
    }

    Utils.isCalledByEvents = function(base) {
        return base.constructor.prototype == EventEmmiter
    }

    Utils.isCalledByInterval = function(base) {
        return base._repeat
    }

    Utils.addToMapList = function(map, key, value) {
        if (map.has(key)) {
            map.get(key).push(value)
        } else {
            map.set(key, [value])
        }
    }

})(J$);

