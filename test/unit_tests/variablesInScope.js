let variable = true

function big() {
    if (variable) {
        let variable = false
        function nested() {
            let variable2 = variable
        }
    }
    nested()
}

big()