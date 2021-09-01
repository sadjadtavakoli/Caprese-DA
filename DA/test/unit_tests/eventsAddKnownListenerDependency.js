var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
    //   do nothing 
}

function adderFunction() {
    eventEmitter.addListener('connection2', listner1);
}


adderFunction()
