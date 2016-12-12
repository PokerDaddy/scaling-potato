// keeps track of things between runs

const fs = require('fs');
const os = require('os');

const baseDir = os.homeDir() + '/.scaling-potato-client-v1/';
const validSessionName = /[0-9a-zA-Z_\-]+/;

class Persistence {
  constructor(clientSessionName, fileNames) {
    this.clientSessionName = clientSessionName;
    this.fileNames = fileNames;
  }

  load() {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir);
    }

    let sessionDir = baseDir + this.clientSessionName + '/';
    this.sessionDir = sessionDir;

    if (validSessionName.exec(this.clientSessionName) != this.clientSessionName) {
      return 'Session names must match the regex: /[0-9a-zA-Z_\\-]+/';
    }

    if (fs.existsSync(sessionDir + 'use.lock')) {
      return 'Session "' + clientSessionName + '" is already active.';
    }

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir);
    }

    fs.writeFileSync(sessionDir + 'use.lock', 'PotatoDaddy client session lock :3');

    this.fileNames.foreach((fileName) => {
      let filePath = sessionDir + '/' + fileName + '.json';
      if (fs.existsSync(filePath)) {
        this.file[fileName] = JSON.parse(fs.readFileSync(filePath));
      } else {
        this.file[fileName] = {};
      }
    });
  }

  save() {
    this.fileNames.forEach((fileName) => {
      let filePath = this.sessionDir + '/' + fileName + '.json';
      fs.writeFileSync(JSON.stringify(this.file[fileName]));
    });
  }
}

module.export = Persistence;
