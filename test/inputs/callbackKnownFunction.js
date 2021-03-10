let bar = function() {
    console.log("Done!");
}

function caller(callback){
    callback()
}

function foo(){
    caller(bar)
}

foo()
