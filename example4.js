const _ = require('lodash'); 

function validateGradsEmails() {
    let grads = JSON.parse(fs.readFile('grads.json'))
    let regex = new RegExp(/\S+@\S+\.\S+/)

    for (let grad of grads) {
        if (!regex.test(grad['email'])) throw Error
    }
    writeData(data, 'grads.json')
}

function validateGradsUsernames() {
    let grads = JSON.parse(fs.readFile('grads.json'))
    let regex = new RegExp(/^[a-zA-Z0-9]+$/)

    for (let grad of grads) {
        if (!regex.test(grad['username'])) throw Error
        grad['username'] = _.toLowerCase(grad['username'])
    }
    writeData(data, 'grads.json')
}

function validateProfsUsernames() {
    let profs = JSON.parse(fs.readFile('profs.json'))
    let regex = new RegExp(/^[a-zA-Z0-9]+$/)

    for (let prof of profs) {
        if (!regex.test(prof['username'])) throw Error
        prof['username'] = _.toLowerCase(prof['username'])
    }
    writeData(data, 'profs.json')
}

function storeData(args) {
    let data = {
            'username': args.email,
            'firstname': args.firstname,
            'email': args.email,
        }
    writeData(data, 'grads.json')
}



change history:

storeData validateGradsUsernames
storeData validateProfsUsernames
validateGradsUsernames validateProfsUsernames
storeData validateGradsUsernames validateGradsEmails

