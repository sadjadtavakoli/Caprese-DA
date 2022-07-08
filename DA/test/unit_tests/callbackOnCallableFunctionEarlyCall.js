let fs = require('fs')

let callbackFunction = function (item) {
    // console.log(item)
}

let caller = function(){    
    let items = [1, 2]
    items.forEach(callbackFunction)    
}
callbackFunction("test")
caller()