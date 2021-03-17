var events = require('events');
var eventEmitter = new events.EventEmitter();

var listner1 = function listner1() {
//   do nothing 
}

eventEmitter.addListener('connection', listner1);
eventEmitter.addListener('connection2', listner1);


eventEmitter.emit('connection');


eventEmitter.addListener('connection2', ()=>{
   //  do nithign
});

eventEmitter.emit('connection');

class test{
   hamintori(){
      // do nothing
      this.eventEmitter2 = new events.EventEmitter();
      this.eventEmitter2.addListener('connection2', this.listner3);
   }
   listner3(){
      // do nothing
   }  
}


let instance = new test()
instance.hamintori()

instance.eventEmitter2.emit('connection2')
eventEmitter.emit('connection');