const fs = require("fs")
const path = require("path")

function changeExtension(file,
    extension) {
    const basename = path.basename(file,
        path.extname(file))
    return path.join(path.dirname(file),
        basename + extension)
}

let files = []


files.forEach(file => {
    let content = fs.readFileSync(file)
    let newName = changeExtension(file,
        ".js")
    fs.writeFileSync(newName,
        content)
    fs.unlinkSync(file)
})