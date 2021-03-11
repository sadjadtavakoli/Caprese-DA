const path = require('path');
const fs = require('fs');
let ACTIVE = false

if (ACTIVE) {
    const directoryPath = path.join(__dirname, 'unit_tests');

    var myArgs = process.argv.slice(2)

    if (myArgs.length > 0) {
        createTest(myArgs)
    }
    else {
        fs.readdir(directoryPath, function (err, all_tests) {
            createTest(all_tests)
        });
    }
    function descriptCreator(file_name) {
        return "describe('Test __file_name__', () => runTest('__file_name__'));".replace(/__file_name__/gi, file_name)
    }

    function createTest(files) {
        let body = "";
        fs.readFile(path.join(__dirname, 'test_blank'), 'utf8', function (err, data) {
            for (let file_index in files) {
                body += descriptCreator(files[file_index]) + "\n"
            }
            let result = data.replace('__TESTS__', body)
            fs.writeFileSync(path.join(__dirname, 'test.js'), result)

        })
    }
}
