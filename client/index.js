// client start file

const Display = require('./interface.js');
const network = require('./network.js');

let dis = new Display();

let server;
let nick;

dis.askQuestion('Server: ').on('response', (response) => {
  server = 'http://' + response + ':8080';
  dis.askQuestion('Nickname: ').on('response', (response) => {
    nick = response;
    start();
  });
});

function start() {
  let session;

  network.login(server, nick).on('login', (body) => {
    if (!body) {
      dis.printError('Invalid server: ' + server);
    }
    session = body;
  }).on('error', (error) => {
    dis.printError(error.Error);
  });

  let lastTime = 0;
  let updateLoopId = setInterval(() => {
    network.update(server, lastTime).on('response', (messages) => {
      if (messages && messages.length > 0) {
        messages.sort((a, b) => {
          if (a.timestamp > b.timestamp) return 1;
          else if (a.timestamp < b.timestamp) return -1;
          else return 0;
        });
        messages.forEach((element) => {
          dis.recieve(element.timestamp, element.nick, element.body);
        });
        lastTime = messages[messages.length - 1].timestamp;
      }
    }).on('error', (error) => {
      dis.printError(error.Error);
    });
  }, 1000); // checking every second should be good enough

  process.stdout.write('> ');

  dis.on('input', (input) => {
    if (input.startsWith('/')) {
      console.log('Commands are not implemented yet.');
      // switch(input) {
      //   case '/nick':
      //
      // }
    } else {
      network.sendMessage(server, session, input).on('error', (error) => {
        dis.printError(error.Error);
      });
    }
    process.stdout.write('> ');
  });

  dis.on('quit', () => {
    console.log('\nQuitting');
    process.exit(0);
  });
}
