
let bar = function() {
    // do nothing
}

let interval  = setInterval(bar, 1000)

setTimeout(()=>{
    clearInterval(interval)
}, 4000)