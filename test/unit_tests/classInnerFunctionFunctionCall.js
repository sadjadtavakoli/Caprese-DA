var events = require('events');

class TextInlines {

    constructor(pdfDocument) {
        this.pdfDocument = pdfDocument;
    }

    buildInlines(currentLineWidth) {
        const getTrimmedWidth = item => {
            return Math.max(0, item);
        };

        getTrimmedWidth(currentLineWidth);

    }
}


let textInlines = new TextInlines("pdfDocument");
textInlines.buildInlines(10)
