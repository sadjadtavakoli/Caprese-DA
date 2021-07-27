var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
//   do nothing 
}

eventEmitter.addListener('connection', listner1);
eventEmitter.addListener('connection2', listner1);

eventEmitter.emit('connection');