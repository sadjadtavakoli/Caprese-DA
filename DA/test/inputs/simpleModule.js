let callee = function(){

    // do nothign

}
let callee2 = function(){

    callee3()

}
let callee3 = function(){

    // do nothign

}
let callee4 = function(){

   callee2()

}

let calleeWithArgs = function (input){
    // do nothign
}

let calleeReturnValue = function (){
    return "value"
}

// callee()

module.exports =  {callee, callee2, callee4, calleeWithArgs, calleeReturnValue};