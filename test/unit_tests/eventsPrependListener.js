var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
    //   do nothing 
}
eventEmitter.prependListener('connection1', listner1);
eventEmitter.addListener('connection2', listner1);

eventEmitter.emit('connection1');