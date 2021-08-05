let fs = require('fs')

fs.readdir('./test/inputs/', function (err, files) {
    console.log(files)
    if (err) {
        console.log('Error finding files: ' + err)
    } else {
        files.forEach(function (filename, fileIndex) {
            fs.readFile('./test/inputs/' + filename, 'utf8', (err, data) => {
                if (err) {
                    return;
                } else {
                    let items = [1, 2]
                    items.forEach(function (item){
                        console.log(item)
                    })
                }
            })
        })
    }
})
