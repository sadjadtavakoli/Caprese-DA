var events = require('events');

class TextInlines {

    constructor(pdfDocument) {
        this.pdfDocument = pdfDocument;
    }
    buildInlines() {
        var eventEmitter = new events.EventEmitter();
        
        function listner1() {
        //   do nothing 
        }
        
        eventEmitter.addListener('connection', listner1);
        
        eventEmitter.emit('connection');
    }
}


let textInlines = new TextInlines("pdfDocument");
textInlines.buildInlines()
