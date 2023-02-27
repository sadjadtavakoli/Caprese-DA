const { REPO_URL, REPO_MAIN_BRANCH, SEED_COMMIT, PROJECT_NAME } = require('../../constants');
const fs = require('fs');
const path = require('path')
const { getChangeSetPath } = require('../evaluationConstants')

if (process.argv[1].endsWith(path.basename(__filename))) {

    readChangeSets()
}

function readChangeSets() {
    let changeSets = JSON.parse(fs.readFileSync(getChangeSetPath()));

    let allChangedEntities = []
    for (let commit of Object.keys(changeSets)) {
        let changes = changeSets[commit]['changes']
        allChangedEntities = allChangedEntities.concat(changes)
    }
    allChangedEntities = getUniques(allChangedEntities)
    allChangedEntities = allChangedEntities.sort(sortEntitiesByLocation())
    fs.writeFileSync(`${PROJECT_NAME}.csv`, getCSVTemplate(allChangedEntities));
}

function getCSVTemplate(allChangedEntities) {
    let body = `,repo:,${REPO_URL},,branch:,${REPO_MAIN_BRANCH}\n,,,,commit:,${SEED_COMMIT}\n
    ,impacted entities,,,,\nchanges,entity_name,file_name,entity_first_line_number,entity_last_line_number,entity_name,file_name,entity_first_line_number,entity_last_line_number,\n`

    for (let change of allChangedEntities) {
        body += `${change},,,,,\n`
        for (var i = 0; i < 10; i++) {
            body += `,,,,,\n`
        }
    }
    return body
}

function getUniques(arr) {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
}

function sortEntitiesByLocation() {
    return function (a, b) {

        let a_splitted = a.split("-")
        let b_splitted = b.split("-")

        let a_begin = parseInt(a_splitted[a_splitted.length - 2])
        let a_file = a_splitted.splice(1, a_splitted.length - 3).join("-")


        let b_begin = parseInt(b_splitted[b_splitted.length - 2])
        let b_file = b_splitted.splice(1, b_splitted.length - 3).join("-")

        if (a_file == b_file) {
            return a_begin - b_begin
        }

        return a_file - b_file
    }
}