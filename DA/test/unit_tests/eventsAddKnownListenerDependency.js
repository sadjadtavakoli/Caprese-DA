var events = require('events');
var eventEmitter = new events.EventEmitter();

function listner1() {
    //   do nothing 
}

function adderFunction() {
    eventEmitter.addListener('connection2', listner1);
}


function adderFunction2() {
    eventEmitter.addListener('connection4', listner1);
}

adderFunction()
adderFunction2()

function thidOne() {
    eventEmitter.emit("connection2")
}

thidOne()