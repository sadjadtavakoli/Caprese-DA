
setTimeout(myFunction, 500);

setTimeout(function() {
    myFunction(); 
    setTimeout(myFunction, 200, "args");
    setTimeout(myFunction, 500, "args");
    setTimeout(myFunction, 200, "args");
}, 500);

function myFunction() {
//  do nothing
}

