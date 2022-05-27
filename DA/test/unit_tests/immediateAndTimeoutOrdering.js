function foo(){
    // do nothing
}

function bar(){
    // do nothing
}

setImmediate(()=>{
    // do nothing
}, "args")

setTimeout(foo, 500, "args")

setTimeout(bar, 0, "args");