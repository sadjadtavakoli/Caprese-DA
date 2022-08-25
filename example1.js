var events = require('events');
var eventEmitter = new events.EventEmitter();

function validateEmails() {
    let data = JSON.parse(fs.readFile('../data/students.json'))
    let regex = new RegExp([
        /\S+@\S+\.\S+/.source
    ].join(''), 'i')

    for (let entry of data) {
        if (entry['email-address'] && regex.test(entry['email-address'])) {
            entry.email = lodash.toLowerCase(entry['email-address'])
            delete entry['email-address']
        }
    }
}

function validateUsernames() {
    let data = JSON.parse(fs.readFile('../data/students.json'))
    let regex = new RegExp([
        sys.config.defaults.prefix,
        /\S+@\S+\.\S+/.source,
        /^[a-zA-Z0-9]+$/.source
    ].join(''), 'i')

    for (let entry of data) {
        if (entry['username'] && regex.test(entry['username'])) {
            entry['username'] = lodash.toLowerCase(entry['username'])
        } else if (entry['firstname'] && regex.test(entry['firstname'])) {
            entry['username'] = lodash.toLowerCase(entry['firstname'])
            delete entry['firstname']
        }
    }
}