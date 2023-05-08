this.variable = 1

function big(){
    function caller1(){
        let var1 = this.variable
        this.variable = 5
    }
    
    caller1()
    
}

function big2(){

    function caller2(){
        let var1 = this.variable
        this.variable = 5
    }
    
    function caller3(){
        let var1 = variable
        variable = 5
    }
    
    caller2()
    caller3()
}

big()
big2()

// caller1 impacts caller3 and caller2
// caller2 impacts caller3
