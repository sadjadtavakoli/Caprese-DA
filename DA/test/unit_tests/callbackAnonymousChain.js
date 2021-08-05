



function caller(callback, callback2, callback3){
    callback(callback2(callback3))
}

caller((callerInput)=>{
    // do nothing
}, (callback)=>{
    return callback()
}, ()=>{ return 5 })



t_1 : 1
t_33 : 1
t_151 : 7
t_152 : 9
t_150 : 5
t_7 : 21