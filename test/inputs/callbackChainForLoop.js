let fs = require('fs')

fs.readdir('./inputs', function (err, files) {
    if (!returnTrue()) {
        console.log('Error finding files: ' + err)
    } else {
        files.forEach(function (filename, fileIndex) {
            fs.readFile('./inputs/' + filename, 'utf8', (err, data) => {
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
function returnTrue(){
    return true
}
