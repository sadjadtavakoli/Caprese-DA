let obj1 = {
    name:"david",
    job: "plumber",
    talk: function(){
        let variable = this.name
    }
}

let obj2 = {
    name:"berke",
    job: "student",
    talk: function(){
        obj1.name = "palviz"
        obj1.talk()
    }
}

obj2.talk()
let var1 = obj1.name

// obj2.talk impacts obj1.talk
// obj2.talk impacts main
