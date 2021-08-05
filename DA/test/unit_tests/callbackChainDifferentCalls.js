let fs = require('fs')

fs.readdir('./test/inputs', function (err, files) {
    if (!err) {

        let filename = "callChain.js"
        fs.readFile('./test/unit_tests/' + filename, 'utf8', (error, data) => {
            let items = [1, 2, 3, 4]
            items.forEach(function (item) {
                console.log("inside foo loop")
            })
        });

        filename = "callChain.js";
        fs.readFile('./test/unit_tests/' + filename, 'utf8', (err2, data) => {
            console.log("inside second one")

        });
    }
});


fs.readdir('./test/inputs', function (err, files) {
    if (!err) {

        let filename = "callChain.js"
        fs.readFile('./test/unit_tests/' + filename, 'utf8', (error, data) => {});
    }
});