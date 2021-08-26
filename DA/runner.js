const Mocha = require("mocha"),
    fs = require("fs"),
    path = require("path");

// Instantiate a Mocha instance.
let mocha = new Mocha();
mocha.reporter('./reporter') // path to custom reporter
let testDir = "./simpleProjectTest/tests"
// read all files in the `test` directory ending with `test.js` extension
fs.readdirSync(testDir).forEach(filename => {
    // add the file to run the tests
    mocha.addFile(path.join(testDir, filename));
});

mocha.run();