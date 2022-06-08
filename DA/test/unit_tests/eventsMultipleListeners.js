var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
    //   do nothing 
}
function listner2() {
    //   do nothing 
}

function adder() {
    eventEmitter.addListener('connection', listner1);
    eventEmitter.addListener('connection', listner2);
}

function adder2() {
    eventEmitter.addListener('connection2', listner1);
}

function emitter() {
    eventEmitter.emit('connection', "args");
}

adder()
adder2()
emitter()