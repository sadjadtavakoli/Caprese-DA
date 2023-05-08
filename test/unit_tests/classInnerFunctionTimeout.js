class TextInlines {

    constructor(pdfDocument) {
        this.pdfDocument = pdfDocument;
    }
    buildInlines() {

        setTimeout(myFunction, 500);
        setTimeout(myFunction, 100);
        setTimeout(() => {

        }, 100);

        function myFunction() {
            //  do nothing
        }


    }
}


let textInlines = new TextInlines("pdfDocument");
textInlines.buildInlines()
