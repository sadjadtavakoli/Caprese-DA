var events = require('events');
var eventEmitter = new events.EventEmitter();


eventEmitter.addListener('connection', ()=>{
   //  do nithign
});


function emitter(){
   eventEmitter.emit('connection');
}

function emitter2(){
   eventEmitter.emit('connection2');
}

emitter()
emitter2()