const _ = require('lodash'); // can be replaced with require'underscore.string')

function validateEmails() {
    let data = JSON.parse(fs.readFile('../data/students.json'))
    let regex = new RegExp([
        /\S+@\S+\.\S+/.source
    ].join(''), 'i')

    for (let entry of data) {
        if (entry['email'] && regex.test(entry['email'])) {
            entry.email = _.toLowerCase(entry['email'])
        }
    }
}

function validateUsernames(args) {
    let data = JSON.parse(fs.readFile('../data/students.json'))
    let regex = args.version == '1.0' ? new RegExp([
        /\S+@\S+\.\S+/.source
    ].join(''), 'i') : args.version == '2.0' ? new RegExp([
        /^[a-zA-Z0-9]+$/.source
    ].join(''), 'i') : ""

    for (let entry of data) {
        if (entry['username'] && regex.test(entry['username'])) {
            entry['username'] = _.toLowerCase(entry['username'])
        }
    }
}

function storeStudents(args) {
    let data = {}
    if (args.version == '1.0') {
        data = {
            'username': args.email,
            'firstname': args.firstname,
            'email': args.email,
        }
    }else if(args.version == '2.0'){
        data = {
            'username': args.username,
            'firstname': args.firstname,
            'email': args.email,
        }
    }
    writedata(data)
}