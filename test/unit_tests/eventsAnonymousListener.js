var events = require('events');
var eventEmitter = new events.EventEmitter();


eventEmitter.addListener('connection', ()=>{
   //  do nithign
});

eventEmitter.emit('connection');
eventEmitter.emit('connection2');