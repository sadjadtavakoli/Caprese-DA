var events = require('events');
var eventEmitter = new events.EventEmitter();

function adderFunction() {
    eventEmitter.addListener('connection2', ()=>{
        // do nothing
    });
}


adderFunction()
