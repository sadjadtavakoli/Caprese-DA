// do not remove the following comment
// JALANGI DO NOT INSTRUMENT
"use strict";

const Mocha = require("mocha");
const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
} = Mocha.Runner.constants; // other constants https://mochajs.org/api/runner.js.html

class Reporter {
    constructor(runner) {
      const stats = runner.stats;
  
      runner
        .once(EVENT_RUN_BEGIN, () => {
            console.log('start');
        })
        .on(EVENT_TEST_PASS, test => {
          console.log(test.state + ": " + test.title + " => " + test.parent.title); // an object containing the test details with `state: passed`
        })
        .on(EVENT_TEST_FAIL, (test, err) => {
            console.log("\n******\n")
            console.log(test.state + ": " + test.title + " => " + test.parent.title); // an object containing the test details with `state: passed`
            console.log(err.message); // err object containing the debug string for the failed test
            console.log("\n******\n")

        })
        .once(EVENT_RUN_END, () => {
            console.log('Overall stats', stats)
            process.exit()
        });
    }
  }
  
  module.exports = Reporter;