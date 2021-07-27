let fs = require('fs')

fs.readdir('./test/inputs', function (err, files) {
    if (!err) {

        let foo = function() {
            console.log("foo");
        }

        let filename = "callChain.js"
        fs.readFile('./test/unit_tests/' + filename, 'utf8', (error, data) => {
            if (!error) {
                let items = [1]
                items.forEach(function (item) {
                    console.log("inside foo loop")
                })
            }
        });
        setTimeout(foo, 1000)

        filename = "callChain.js";
        fs.readFile('./test/unit_tests/' + filename, 'utf8', (err2, data) => {
            if (!err2) {
                console.log("inside second one")
                
            }
        });
    }
});


fs.readdir('./test/inputs', function (err, files) {
    if (!err) {

        let filename = "callChain.js"
        fs.readFile('./test/unit_tests/' + filename, 'utf8', (error, data) => {
        });
    }
});