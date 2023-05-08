this.variable = 1

function big(){
    function caller1(){
        let variable = 2
        let var1 = variable
    }
    
    caller1()
    
}

function big2(){

    function caller3(){
        let var1 = variable
        variable = 5
    }
    
    caller2()
    caller3()
}

big()
big2()



// No impact