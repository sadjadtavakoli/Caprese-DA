variable = 1

function big(){
    function caller1(){
        let variable = 2
        let var1 = variable
        variable = 3
    }
    
    caller1()
    
}

function big2(){

    function caller3(){
        let var1 = variable
        variable = 5
    }
    
    caller3()
}

big()
big2()


// only main impacts caller3 