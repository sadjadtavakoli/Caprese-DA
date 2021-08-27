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
        return J$.iidToLocation(iid).split(':')[0].substring(1);
    }
    Utils.getLine = function(iid) {
        return J$.iidToLocation(iid).split(':')[1]
    }

    Utils.getEndLine = function(iid) {
        return J$.iidToLocation(iid).split(':')[3]
    }    

    Utils.getPositionInLine = function(iid) {
        return J$.iidToLocation(iid).split(':')[2]
    }

    Utils.getIIDKey = function(functionName, iid){
        let locationList = J$.iidToLocation(iid).split(':')
        let filePath = locationList[0].substring(1)
        let line = locationList[1]
        let Endline = locationList[3]
        return `${functionName}-${filePath}-${line}-${Endline}`
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

    Utils.isForEach = function(func){
        return func == Array.prototype.forEach
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

    Utils.isCalledByTimeout = function(base) {
        return base._onTimeout && !base._repeat
    }

    Utils.addToMapList = function(map, key, value, distinct) {
        if (map.has(key)) {
            map.get(key).push(value)
            if(distinct){
                map.set(key, [...new Set(map.get(key))])
            }
        } else {
            map.set(key, [value])
        }
    }

    Utils.isTestFunction = function(){
        return false
    }
})(J$);

