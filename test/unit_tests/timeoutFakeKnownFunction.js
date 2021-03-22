let bar = function() {
    console.log("Done!");
}

foo()

function foo(){
    setTimeout(bar, 10 * 1000)
}

function setTimeout(callback, time){
    // do nothing
}