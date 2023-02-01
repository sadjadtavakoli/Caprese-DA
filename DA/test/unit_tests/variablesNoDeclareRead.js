this.variable = 1
this.variable2 = 1

function big(){
    function caller1(){
        this.variable2 = this.variable
    }
    
    caller1()
    
}

big()