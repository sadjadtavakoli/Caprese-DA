var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
    //   do nothing 
}
function listner2() {
    //   do nothing 
}

eventEmitter.addListener('connection1', () => {
    eventEmitter.emit('connection2', "args");
});

function adder() {
    eventEmitter.addListener('connection1', listner1);
}

function adder2(){
    eventEmitter.addListener('connection2', listner2);
    eventEmitter.addListener('connection2', listner1);
}

function emitter(){
    eventEmitter.emit('connection1', "args");
}

adder()
adder2()
emitter()
