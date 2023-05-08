let obj1 = {
    name:"david",
    job: "plumber",
    talk: function(){
        let variable = this.name
    }
}

obj1.name = "berke"
obj1.talk()

// main impacts obj1.talk