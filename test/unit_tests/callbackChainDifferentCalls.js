let fs = require('fs')

fs.readdir('./test/callbackTestDir_DO_NOT_CHANGE/', function (err, files) {
    if (!err) {

        let filename = "1"
        fs.readFile('./test/callbackTestDir_DO_NOT_CHANGE/' + filename, 'utf8', (error, data) => {
            let items = [1, 2, 3, 4]
            items.forEach(function (item) {
                return "hell YEAH!"
            })
        });

        filename = "1";
        fs.readFile('./test/callbackTestDir_DO_NOT_CHANGE/' + filename, 'utf8', (err2, data) => {

        });
    }
});


fs.readdir('./test/callbackTestDir_DO_NOT_CHANGE', function (err, files) {
    if (!err) {

        let filename = "1"
        fs.readFile('./test/unit_tests/' + filename, 'utf8', (error, data) => { });
    }
});