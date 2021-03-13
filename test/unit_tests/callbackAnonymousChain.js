function caller(callback, callback2, callback3){
    callback(callback2(callback3))
}

caller((callerInput)=>{
    // do nothing
}, (callback)=>{
    return callback()
}, ()=>{ return 5 })