let bar = function() {
    console.log("Done!");
}

foo()

function foo(){
    setTimeout(bar, 500, "value")
}