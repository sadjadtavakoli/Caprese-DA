let fs = require('fs')

fs.readdir('./inputs', function (err, files) {
    if (err) {
        console.log('Error finding files: ' + err)
    } else {
        let filename = "simpleTrace.js"
        fs.readFile('./inputs/' + filename, 'utf8', (err, data) => {
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

        filename = "simpleCallback.js";
        fs.readFile('./inputs/' + filename, 'utf8', (err, data) => {
            if (err) {
                throw error
            } else {
                    // Do nothing
            }
        });
    }
});