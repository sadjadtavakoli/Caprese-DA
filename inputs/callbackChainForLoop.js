let fs = require('fs')

fs.readdir('./inputs', function (err, files) {
    if (!returnTrue()) {
        console.log('Error finding files: ' + err)
    } else {
        files.forEach(function (filename, fileIndex) {
            console.log(filename)
            fs.readFile('./inputs/' + filename, 'utf8', (err, data) => {
                if (err) {
                    console.error(err)
                    return
                } else {
                    console.log(filename)
                    let items = [1, 2, 3, 4, 5, 56]
                    items.forEach(function (item){
                        console.log(item)
                    })
                }
            })
            // return
            console.log('----------------------------------------')
        })
    }
})
function returnTrue(){
    return true
}
