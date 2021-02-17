// do not remove the following comment
// JALANGI DO NOT INSTRUMENT

(function (sandbox) {
    function Analyser() {

        // class Graph {
        //     constructor() {
        //         this.adjList = new Map();
        //     }
        //
        //     addEdge(v, w){
        //             let item = this.adjList.get(v);
        //             if(item === undefined){
        //                 item.set([]);
        //
        //       }
        //     }
        //     printGraph(){
        //
        //     }
        // }

        this.invokeFunPre = function (iid, f, base, args, isConstructor, isMethod) {
            console.log("function invoke")
            console.log(J$.iidToLocation(iid))
            console.log(iid)
            console.log("--")

        };

        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod) {
            console.log("function BBnvoke")
            console.log(J$.iidToLocation(iid))
            console.log(iid)
            console.log("--")
        };

        this.functionEnter = function (iid, func, receiver, args) {
            console.log("function enter")
            // console.log(J$.iidToLocation(iid).split(':'))
            console.log(J$.iidToLocation(iid))
            console.log(iid)
            // console.log(func.name)
            // if(func.caller != undefined){
            //     console.log(func.caller.name)
            // console.log(J$.iidToLocation(func.caller))
            // }
            console.log("--")
        };


        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            console.log("functionExit")
            console.log(J$.iidToLocation(iid))
            console.log(iid)
            console.log("--")
        }

        this.endExecution = function () {
        };
    }

    sandbox.analysis = new Analyser();
})(J$);
