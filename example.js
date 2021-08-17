var events = require('events');
var eventEmitter = new events.EventEmitter();

function usernameGenerator(){
    randomGenerator()
    checkUniqueness()

}

function usernameValidator(){
    parseInput()
    checkUniqueness()
    let error = false; 
    if(error){
        eventEmitter.addListener('connection1', errorHandler);
    }
}

function emailValidator(){
    parseInput()
    checkEmailUniqueness()
    let error = false; 
    if(error){
        eventEmitter.addListener('connection1', errorHandler);
    }
}
function errorHandler()
