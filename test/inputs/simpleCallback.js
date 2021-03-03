
function myFunction(num1, num2, myCallback) {
  let sum = num1 + num2;
  myCallback(sum);
}

myFunction(5, 5, (sum) => { //#NOTE Initializing and calling functions in this way, we don't have any name to address them, just ID and line number.
  console.log("result => " + sum)
}
) ;


function callbackFunction(sum){
  console.log("result => " + sum)
}


myFunction(5, 5, callbackFunction) ; //#NOTE While, obviously, in this version we have method names to address.


let callbackFunction2 = function (sum){
  console.log("result => " + sum)
}

myFunction(5, 5, callbackFunction2) ; //#NOTE While, obviously, in this version we have method names to address.

