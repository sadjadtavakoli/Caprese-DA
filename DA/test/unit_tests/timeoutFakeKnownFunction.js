let bar = function () {
    console.log("Done!");
}

foo()

function foo() {
    setTimeout(bar, 100000)
}

function setTimeout(callback, time) {
    // do nothing
}