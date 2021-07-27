var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
    //   do nothing 
}

function listner2() {
    //   do nothing 
}

function listner3() {
    // do nothing
}

eventEmitter.addListener('connection', listner1);
eventEmitter.addListener('connection2', listner2);

let eventEmitter2 = new events.EventEmitter();
eventEmitter2.addListener('connection2', listner3);


eventEmitter2.emit('connection2')
eventEmitter.emit('connection');