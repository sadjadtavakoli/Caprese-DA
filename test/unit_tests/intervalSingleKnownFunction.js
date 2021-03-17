
let bar = function() {
    // do nothing
}

let interval  = setInterval(bar, 250)

setTimeout(()=>{
    clearInterval(interval)
}, 1000)