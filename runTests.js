const path = require('path');
const fs = require('fs');

const directoryPath = path.join(__dirname, 'inputs');

fs.readdir(directoryPath, function (err, files) {

    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }

    files.forEach(function (file) {
        execute('$GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/nodeprof.jar --nodeprof $NODEPROF_HOME/jalangi.js --analysis analyser.js inputs/' + file);
        console.log("here")
        // child();
    });
});

function execute(command) {
  const exec = require('child_process').exec

  exec(command, (err, stdout, stderr) => {
    process.stdout.write(stdout)
  })
}

