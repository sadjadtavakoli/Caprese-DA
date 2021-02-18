function firstOne(input11, input12){
    let result1 = secondOne(input11);
    thirdOne(input12);
    let input14 = input12;
    fourthOne(input14);
    sixthOne(result1);
}


function secondOne(input21){
    fifthOne("from second one")
    input21 = input21 + 2;
    return  input21
}

function fifthOne(input5){
    console.log("=== in fifthOne === " + input5)
}

function thirdOne(input31, input32=5){
    fifthOne("from thirdOne with value = " + input31 * input32 )
}

function fourthOne(){
//    do nothing
}

function sixthOne(input6){
    (function (input6){
        console.log("in in sixthone")
    })()
    return "hi"
}

firstOne(106016, 1020315)

