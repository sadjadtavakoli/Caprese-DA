const _ = require('lodash');
const { InvalidAlgorithmError } = require('sshpk');

function addType(element){
let name = null;
if(element.hadattr('name')){
    name = element.get('name')
}else{
    throw new InvalidTypeException(
        "The given type is not supported")
}

names = null;
if (name.indexOf('(') === -1) {
    names = { entityName: name, tableName: _.snakeCase(name).toLowerCase() };
}else{
    const split = name.split('(');
    names = {
    entityName: split[0].trim(),
    tableName: _.snakeCase(
      split[1].slice(0, split[1].length - 1).trim()
    ).toLowerCase()
    }
}

let data = {"name":_.lowerCase(name), "tableName":ames.tableName}

checkForReservedTableName({
    name: data.tableName,
    databaseTypeName: databaseTypes.getName(),
    shouldThrow: true
});
// elementType = null;
// for(objectType of this.objectTypes){
//     if(objectType.name == element.prototype.name){
//         elementType = objectType
//         break;
//     }
// }


parsedData.addType(element.$['xmi:id'], data);
}



function addClass(element) {
    
    let name = null
    if(element.hadattr('name')){
        name = element.get('name')
    }else{
        throw new InvalidTypeException(
            "The given class is not supported")
    }
    let names = null
    if (name.indexOf('(') === -1) {
        names = { entityName: name, tableName: _.snakeCase(name).toLowerCase() };
    }else{
        const split = name.split('(');
        names = {
        entityName: split[0].trim(),
        tableName: _.snakeCase(
          split[1].slice(0, split[1].length - 1).trim()
        ).toLowerCase()
        }
    }    const classData = {
      name: _.upperFirst(names.entityName),
      tableName: names.tableName
    };
    checkForReservedClassName({
      name: classData.name,
      shouldThrow: true
    });
    if (classData.tableName.toLowerCase() !== 'user'
      || (classData.tableName.toLowerCase() === 'user' && !noUserManagement)) {
      checkForReservedTableName({
        name: classData.tableName,
        databaseTypeName: databaseTypes.getName(),
        shouldThrow: true
      });
    }
    if (element.eAnnotations && element.eAnnotations[0].details
      && element.eAnnotations[0].details.length > 1
      && element.eAnnotations[0].details[1].$.key === 'gmm-documentation') {
      classData.comment = element.eAnnotations[0].details[1].$.value;
    }
  
    parsedData.addClass(element.$['xmi:id'], classData);
  }