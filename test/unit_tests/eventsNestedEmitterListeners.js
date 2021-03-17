var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
    //   do nothing 
}
function listner2() {
    //   do nothing 
}

eventEmitter.addListener('connection1', ()=>{
    eventEmitter.emit('connection2');
});
eventEmitter.addListener('connection1', listner1);
eventEmitter.addListener('connection2', listner2);
eventEmitter.addListener('connection2', listner1);

eventEmitter.emit('connection1');