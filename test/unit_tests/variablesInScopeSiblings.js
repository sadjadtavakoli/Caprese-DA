let variable = true
let variable2 = false

function big() {
    if (variable) {
        let variable = false
        function nested() {
            let variable2 = variable
        }
    }

    function nested2() {
        let variable2 = variable
    }

    nested()
    nested2()
}

function big2() {
    let variable = false

    function nested3() {
        let variable2 = variable
    }

    function nested4() {
        let variable2 = variable
    }

    nested3()
    nested4()
}

big()
big2()