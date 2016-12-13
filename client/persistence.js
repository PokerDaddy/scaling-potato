// keeps track of things between runs

const fs = require('fs');
const os = require('os');
const path = require('path');

const cache = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '/.cache')
const baseDir = path.join(cache, '/scaling-potato/');
const validSessionName = /[0-9a-zA-Z_\-]+/;

class Persistence {
  constructor(clientSessionName, fileNames) {
    this.clientSessionName = clientSessionName;
    this.fileNames = fileNames;
    this.files = [];
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
      return 'Session "' + this.clientSessionName + '" is already active.';
    }

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir);
    }

    fs.writeFileSync(sessionDir + 'use.lock', 'PotatoDaddy client session lock :3');

    this.fileNames.forEach((fileName) => {
      let filePath = sessionDir + '/' + fileName + '.json';
      if (fs.existsSync(filePath)) {
        this.files[fileName] = JSON.parse(fs.readFileSync(filePath));
      } else {
        this.files[fileName] = {};
      }
    });

    return 'Success.';
  }

  save() {
    fs.unlinkSync(this.sessionDir + 'use.lock');
    this.fileNames.forEach((fileName) => {
      let filePath = this.sessionDir + '/' + fileName + '.json';
      fs.writeFileSync(filePath, JSON.stringify(this.files[fileName]));
    });
  }
}

module.exports = Persistence;
