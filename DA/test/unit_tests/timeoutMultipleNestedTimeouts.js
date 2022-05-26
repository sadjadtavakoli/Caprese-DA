
setTimeout(myFunction, 500);

setTimeout(function() {
    myFunction(); 
    setTimeout(myFunction, 200);
    setTimeout(myFunction, 500);
    setTimeout(myFunction, 200);
}, 500);

function myFunction() {
//  do nothing
}

