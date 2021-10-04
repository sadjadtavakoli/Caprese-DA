class StyleContextStack {

    autopush(item) {

        let styleProperties = [
            'value',
            'value2',
            'value3',
        ];

        let styleOverrideObject = {};

        styleProperties.forEach(key => {
            test()
            styleOverrideObject[key] = item;
        });

    }

    auto(item, callback) {
        this.autopush(item);
        return callback();
    }

}

let styleContext = new StyleContextStack()
styleContext.auto("item", () => {
    // nothing
})

function test(){
// nothing
}