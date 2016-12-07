// client start file

const Display = require('./interface.js');
const network = require('./network.js');

let dis = new Display();

// TODO: placeholder nick
let nick = "Kneelawk";
// TODO: placeholder server
let server = "http://localhost:8080";
let session;

network.login(server, nick).on('login', (body) => {
  if (!body) {
    // TODO: more error handling
  }
  session = body;
}).on('error', (error) => {
  // TODO: error handling
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
    // TODO: error handling
  });
}, 1000); // checking every second should be good enough

// TODO: get input from user
// TODO: stopping the client and disconnecting
