
setTimeout(myFunction, 1000);

setTimeout(function() {
    myFunction(); 
    setTimeout(myFunction, 500);
    setTimeout(myFunction, 1000);
    setTimeout(myFunction, 500);
}, 500);

function myFunction() {
//  do nothing
}

