class SimpleClass{
    constructor(variable_1, variable_2) {
        this.variable_1 = variable_1;
        this.variable_2 = variable_2;
    }

    classFunction(){
        return this.variable_1
    }
    variable_3 = 14;

    static classStaticFunction(){
        return 100;
    }
}


let simpleInstance = new SimpleClass(4, 5)

let tempt_1 = simpleInstance.variable_1
let tempt_2 = simpleInstance.variable_2

simpleInstance.variable_3 = tempt_2 * tempt_1;

let functionCallResult = simpleInstance.classFunction()


let classStaticMethodCall = SimpleClass.classStaticFunction();
