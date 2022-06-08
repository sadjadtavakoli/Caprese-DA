
let bar = function(input) {
    // do nothing
}

let interval  = setInterval(bar, 50, "args")

setTimeout(()=>{
    clearInterval(interval)
}, 500)