const fs = require('fs')


let data = "let's try that"
fs.writeFile("temp.txt", data, (err) => {
    if (err) console.log(err);
    console.log("Successfully Written to File.");
});


function readFile() {
    fs.readFile("temp.txt", "utf-8", (err, data) => {
        console.log(data);
    });
}

readFile();
