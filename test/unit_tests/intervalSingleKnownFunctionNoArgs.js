
let bar = function() {
    // do nothing
}

let interval  = setInterval(bar, 50)

setTimeout(()=>{
    clearInterval(interval)
}, 500)