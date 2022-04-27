const fs = require("fs")
const path = require("path")
const resultDirPath = `evaluation${path.sep}result${path.sep}`

let finalResult = {}
fs.readdirSync(resultDirPath).forEach(filename => {
    console.log(filename)
    let fp = 0
    let da = 0
    let common = 0
    let result = JSON.parse(fs.readFileSync(`${resultDirPath}${filename}${path.sep}contribution${path.sep}results.json`))
    for(let commit in result){
        fp+=result[commit]["FP"].length
        da+=result[commit]["DA"].length
        common+=result[commit]["Common"].length
    }
    finalResult[filename] = {"fp":fp, "da":da, "common":common}
});

console.log(finalResult)


