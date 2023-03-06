const fs = require("fs")
const path = require('path');
const constants = require('../../constants.js');

const CALL_GRAPH_PATH = path.dirname(path.dirname(__dirname)) + path.sep + 'data' + path.sep + "ProjectsData" + path.sep + constants.PROJECT_NAME + path.sep + "callGraph.json";


insertCallers("_route-fastify.js-263-267")
function insertCallers(entity) {
    let callGraph = JSON.parse(fs.readFileSync((CALL_GRAPH_PATH)));
    let callerList = []
    if (callGraph[entity]) {
        callerList = callGraph[entity]['impacted']
    } else if (callGraph[anonymouseName(entity)]) {
        callerList = callGraph[anonymouseName(entity)]['impacted']
    }

    let result = "\n"
    for (let caller of callerList) {
        let callerSecs = caller.split("-")
        if (!parseInt(callerSecs[callerSecs.length - 1])) {
            result += `${1} & ${caller} &`
            result += `1 & \\\\\n`

        }else{
            result += `${callerSecs[0]} , ${callerSecs.splice(1, callerSecs.length - 3).join("-")} ,`
            result += `${callerSecs[callerSecs.length - 2]} , ${callerSecs[callerSecs.length - 1]} \n`
        }

    }
    console.log(result)
}

function anonymouseName(name) {
    return name.replace(/((?![.])([^-])*)/, "arrowAnonymousFunction");
}