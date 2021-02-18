// do not remove the following comment
// JALANGI DO NOT INSTRUMENT

(function (sandbox) {
    function Analyser() {
        let functionsIDs = new Map();

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
            console.log("function invoke => " + f.name +" with id " + iid +  " at => " + J$.iidToLocation(iid))

        };

        this.invokeFun = function (iid, f, base, args, result, isConstructor, isMethod) {
            console.log("function Revoke => " + f.name +" with id " + iid +  " at => " + J$.iidToLocation(iid))
        };

        this.functionEnter = function (iid, func, receiver, args) {
            console.log("function Enter => " + func.name +" with id " + iid +  " at => " + J$.iidToLocation(iid))
            functionsIDs.set(iid, func.name)
        };


        this.functionExit = function (iid, returnVal, wrappedExceptionVal) {
            console.log("function Exit => " + functionsIDs.get(iid) + " with id " + iid +  " at => " + J$.iidToLocation(iid))
        }

        this.endExecution = function () {
            console.log("----------------------------------------------")
        };
    }

    sandbox.analysis = new Analyser();
})(J$);
