var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
    //   do nothing 
}
function adder() {
    eventEmitter.once('connection1', listner1);
}
function adder2() {
    eventEmitter.addListener('connection2', listner1);
}

function emitter() {
    eventEmitter.emit('connection1');
}

adder()
adder2()
emitter()