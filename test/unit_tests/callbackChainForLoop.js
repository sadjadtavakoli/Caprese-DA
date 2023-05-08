let fs = require('fs')

fs.readdir('./test/callbackTestDir_DO_NOT_CHANGE/', function (err, files) {
    if (err) {
        console.log('Error finding files: ' + err)
    } else {
        files.forEach(function (filename, fileIndex) {
            fs.readFile('./test/callbackTestDir_DO_NOT_CHANGE/' + filename, 'utf8', (err, data) => {
                if (err) {
                    return;
                } else {
                    let items = [1, 2]
                    items.forEach(function (item){
                    })
                }
            })
        })
    }
})
