function foo(){
    // do nothing
}

function bar(){
    // do nothing
}

setImmediate(()=>{
    // do nothing
})

setTimeout(foo, 500)

setTimeout(bar, 0);