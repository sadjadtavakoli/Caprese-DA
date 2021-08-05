let fs = require('fs')

fs.readdir('./test/inputs/', function (err, files) {
    if (err) {
        console.log('Error finding files: ' + err)
    } else {
        files.forEach(function (filename, fileIndex) {
            let items = [1, 2]
            items.forEach(function (item) {
            })
        })
    }
})
