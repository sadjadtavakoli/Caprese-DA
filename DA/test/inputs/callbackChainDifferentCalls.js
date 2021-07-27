let fs = require('fs')

fs.readdir('./test/inputs', function (err, files) {
    if (err) {
        console.log('Error finding files: ' + err)
    } else {

        let foo = function() {
            console.log("Done!");
        }

        let filename = "simpleTrace.js"
        fs.readFile('./test/inputs/' + filename, 'utf8', (err, data) => {
            if (err) {
                console.error(err)
                return
            } else {
                let items = [1]
                items.forEach(function (item) {
                    // Do nothing
                })
            }
        });
        setTimeout(foo, 10 * 1000)

        filename = "simpleCallback.js";
        fs.readFile('./test/inputs/' + filename, 'utf8', (err, data) => {
            if (err) {
                throw err
            } else {
                    // Do nothing
            }
        });
    }
});