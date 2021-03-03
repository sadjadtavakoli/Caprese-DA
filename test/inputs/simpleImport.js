let firstOne = require('./simpleTrace.js').firstOne

let caller = function (input1, input2){
    return firstOne(input1, input2)
}

caller(1234, 4566)
