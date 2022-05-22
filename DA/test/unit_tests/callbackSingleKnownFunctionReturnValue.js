let bar = function() {
    return "value"
}

function caller(callback){
    let value = callback()
}

function foo(){
    caller(bar)
    return "Hi"
}

foo()
w