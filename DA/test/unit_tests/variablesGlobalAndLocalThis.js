variable = 1

function big(){
    function caller1(){
        this.variable = 2
        let var2 = this.variable 
    }
    
    caller1()
    
}

function big2(){

    function caller2(){
        let var1 = variable
        variable = 5
    }
    caller2()
}

big()
big2()

console.log(variable)


// main impacts caller1 and caller2
// caller1 impacts caller2