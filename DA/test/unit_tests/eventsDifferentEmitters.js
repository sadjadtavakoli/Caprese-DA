var events = require('events');
var eventEmitter = new events.EventEmitter();
let eventEmitter2 = new events.EventEmitter();

function listner1() {
    //   do nothing 
}

function listner2() {
    //   do nothing 
}

function listner3() {
    // do nothing
}

function adder() {
    eventEmitter.addListener('connection', listner1);
}
function adder2() {
    eventEmitter.addListener('connection2', listner2);
}

function adder3() {
    eventEmitter2.addListener('connection2', listner3);
}

function emitter() {
    eventEmitter2.emit('connection2', "args")
}
function emitter2() {
    eventEmitter.emit('connection', "args");
}


adder()
adder2()
adder3()

emitter()
emitter2()