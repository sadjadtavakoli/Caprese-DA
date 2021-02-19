let variable_1 = 123;
let variable_2 = 345;

if(variable_1 === variable_2){
    console.log("yeap!")
}else{
    console.log("nope!")
    switch (variable_2){
        case 124:
            console.log("meh");
            break
        case 234:
            console.log("meh2");
            break
        case 345:
            console.log("a different animal!")
            break
        default:
            console.log("Go out!")
    }
}
