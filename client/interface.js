/**
 * Chat interface
 * really really simple, but im not sure what else to add for now?
 **/

const Callback = require('events');
const readline = require('readline');

class QuestionCallback extends Callback {}

class Display extends Callback {
  constructor() {
    super();
    this.cli = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    }).on('line', (line) => this.emit('input', line)).on('SIGINT', () => this.emit('quit'));
    this.cli.setPrompt('');
  }

  recieve(timestamp, nick, id, body) {
    console.log(`[${timestamp}]${nick}:${id}: ${body}`);
  }

  printError(error) {
    console.log('Error: ' + error);
  }

  askQuestion(prompt) {
    let callback = new QuestionCallback();

    this.cli.question(prompt, (response) => callback.emit('response', response));

    return callback;
  }
}

module.exports = Display;
