let variable = 1

function big(){
    function caller1(){
        let var1 = this.variable
        this.variable = 3
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


// main impacts caller2