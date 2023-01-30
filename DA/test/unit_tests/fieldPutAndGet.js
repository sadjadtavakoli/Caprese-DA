let obj1 = {
    name:"sadjad",
    job: "researcher",
    talk: function(){
        let variable = this.name
    }
}

obj1.name = "berke"
obj1.talk()

// main impacts obj1.talk