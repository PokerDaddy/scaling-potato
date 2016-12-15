// New client start file
// by PokerDaddy

const network = require('./network.js');
const Display = require('./interface.js');
const Persistence = require('./persistence.js');

const help = `
scaling-potato help by PokerDaddy:
Commands:
/login <server> <nick>      - Asks <server> for a new token associated with <nick>.
/forcelogin <server> <nick> - Gets a new token from the server even if the server accepts your current one with <nick>.
/connect <server>           - Connects to a server using a previously set token. Best used for reconnecting.
/nick <nick>                - Sets your current connected user's nickname to <nick>.
/disconnect                 - Disconnects from the current server.
/help                       - Prints this help message.
`;

class CurrentServerdata {
  constructor(serverName) {
    this.servername = serverName;
    this.lastMessageTime = 0;
  }
}

const pers = new Persistence(process.argv[2] || 'default', ['settings', 'servers']);

let result = pers.load();
if (result != 'Success.') {
  console.log(result);
  process.exit(1);
}

const dis = new Display;

let currentServer = null;
let currentSession = null;
let currentServerData = {};

let updateCheckerId = null;

dis.on('input', (line) => {
  if (line.startsWith('/')) {
    let cmd = line.split(' ');
    switch (cmd[0]) {
      case '/login':
        loginToServer(cmd[1], cmd[2]);
        break;
      case '/forcelogin':
        forceLogin(cmd[1], cmd[2]);
        break;
      case '/connect':
        connectToServer(cmd[1]);
        break;
      case '/msg':
        {
          if (cmd.length < 3) {
            console.log('/msg <user-id> <message>');
            break;
          }
          let str = cmd[2];
          for (let index = 3; index < cmd.length; index++) {
            str += ' ' + cmd[index];
          }
          sendPrivateMessageById(cmd[1], str);
        }
        break;
      case '/msgn':
        {
          if (cmd.length < 3) {
            console.log('/msgn <nick> <message>');
            break;
          }
          let str = cmd[2];
          for (let index = 3; index < cmd.length; index++) {
            str += ' ' + cmd[index];
          }
          sendPrivateMessageByNick(cmd[1], str);
        }
        break;
      case '/nick':
        changeNickname(cmd[1]);
        break;
      case '/disconnect':
        disconnectFromServer();
        break;
      case '/help':
        printHelp();
        break;
      default:
        console.log('Unrecognized command: ' + cmd[0]);
        console.log('Use /help to list commands.');
        break;
    }
  } else {
    sendMessage(line);
  }
}).on('quit', () => {
  pers.save();
  stopUpdateChecker();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.log(error);
  pers.save();
  process.exit(1);
});

function printHelp() {
  console.log(help);
}

function connectToServer(server) {
  let serverData = pers.files.servers[server];
  let serverUrl = `http://${server}:8080`;
  if (serverData) {
    network.getUser(serverUrl, {
      token: serverData.session.token
    }).on('user', (user) => {
      if (user) {
        console.log('Reconnection successful.');
        user.token = serverData.session.token;
        pers.files.servers[server] = {
          session: user
        };
        currentSession = user;
        currentServer = serverUrl;
        currentServerData[serverUrl] = new CurrentServerdata(server);
        startUpdateChecker();
      } else {
        console.log("This server doesn't remember you.");
        console.log('You might want to /login');
      }
    }).on('error', (error) => {
      console.log('Error connecting to ' + server);
    });
  } else {
    console.log('You have never logged into this server before.');
    console.log('Maybe you will want to /login');
  }
}

function forceLogin(server, nick) {
  login(server, nick);
}

function loginToServer(server, nick) {
  let serverData = pers.files.servers[server];
  let serverUrl = `http://${server}:8080`;

  if (serverData) {
    network.getUser(serverUrl, {
      token: serverData.session.token
    }).on('user', (user) => {
      if (user) {
        console.log('This server remembers you. You can just /connect or login again with /forcelogin');
      } else {
        login(server, nick);
      }
    }).on('error', (error) => {
      console.log('Error connecting to ' + server);
    });
  } else {
    login(server, nick);
  }
}

function login(server, nick) {
  let serverUrl = `http://${server}:8080`
  console.log('Logging into: ' + server);
  network.login(serverUrl, nick).on('login', (session) => {
    console.log('Your are now logged in as: ' + session.nick + '#' + session.id);
    pers.files.servers[server] = {
      session
    };
    currentSession = session;
    currentServer = serverUrl;
    currentServerData[serverUrl] = new CurrentServerdata(server);
    startUpdateChecker();
  }).on('error', (error) => {
    console.log('Login error.');
  });
}

function disconnectFromServer() {
  stopUpdateChecker();
  currentSession = null;
  currentServer = null;
  console.log('Disconnected.');
}

function sendMessage(message) {
  if (currentSession) {
    network.sendMessage(currentServer, currentSession, message).on('error', (error) => {
      console.log('Error sending the message.');
    });
  } else {
    console.log('You must be connected to a server to send messages.');
  }
}

function startUpdateChecker() {
  if (!updateCheckerId) {
    updateCheckerId = setInterval(checkForUpdates, 1000);
  }
}

function stopUpdateChecker() {
  if (updateCheckerId) {
    clearInterval(updateCheckerId);
    updateCheckerId = null;
  }
}

function checkForUpdates() {
  network.update(currentServer, currentServerData[currentServer].lastMessageTime).on('response', (publicMessages) => {
    network.updateDirects(currentServer, currentSession, currentServerData[currentServer].lastMessageTime).on('response', (directMessages) => {
      let messages;
      if ((publicMessages && publicMessages.length > 0) && (directMessages && directMessages.length > 0)) {
        messages = publicMessages.concat(directMessages.map((e) => {
          e.direct = true;
          return e;
        }));
      } else if (publicMessages && publicMessages.length > 0) {
        messages = publicMessages;
      } else if (directMessages && directMessages.length > 0) {
        messages = directMessages;
      }
      if (messages && typeof(messages) == 'object') {
        messages.sort((a, b) => {
          if (a.timestamp > b.timestamp) return 1;
          else if (a.timestamp < b.timestamp) return -1;
          else return 0;
        });
        messages.forEach((message) => {
          if (message.direct) {
            dis.recieveDirect(message.timestamp, message.nick, message.id, message.body);
          } else {
            dis.recieve(message.timestamp, message.nick, message.id, message.body);
          }
        });
        currentServerData[currentServer].lastMessageTime = messages[messages.length - 1].timestamp;
      }
    }).on('error', (error) => {
      console.log('Server timed out.');
      disconnectFromServer();
    });
  }).on('error', (error) => {
    console.log('Server timed out.');
    disconnectFromServer();
  });
}

function changeNickname(newNickname) {
  if (currentSession) {
    currentSession.nick = newNickname;
    network.changeNickname(currentServer, currentSession).on('response', (response) => {
      console.log(`Nickname set to ${response.nick}`);
    }).on('error', (error) => {
      console.log('Error setting nickname.');
    });
  } else {
    console.log('You must be logged into a server to have a nickname.');
  }
}

function sendPrivateMessageByNick(recipient, message) {
  if (currentSession) {
    network.getUsers(currentServer, {
      nick: recipient
    }).on('users', (users) => {
      if (users && users.length > 0) {
        if (users.length > 1) {
          console.log('Found ' + users.length + ' users with the nick: ' + recipient);
        }
        users.forEach((user) => {
          network.sendDirectMessage(currentServer, currentSession, user.id, message).on('response', (messageObj) => {
            console.log('You sent to [' + user.nick + '#' + user.id + ']: ' + message);
          }).on('error', (error) => {
            console.log('Error sending to: ' + user.nick + '#' + user.id);
          });
        });
      } else {
        console.log('No user with the nick: ' + recipient);
      }
    }).on('error', (error) => {
      console.log('Error getting users from the server.');
    });
  } else {
    console.log('You must be connected to a server to send messages.');
  }
}

function sendPrivateMessageById(recipientId, message) {
  if (currentSession) {
    network.sendDirectMessage(currentServer, currentSession, recipientId, message).on('response', (messageObj) => {
      network.getUser(currentServer, {
        id: recipientId
      }).on('user', (user) => {
        if (user) {
          console.log('You sent to [' + user.nick + ';' + user.id + ']: ' + message);
        } else {
          console.log('No user with the id: ' + recipientId);
        }
      }).on('error', (error) => {
        console.log('You sent to [' + recipientId + '] (they might not exist): ' + message);
      });
    }).on('error', (error) => {
      console.log('Error sending to: ' + recipientId);
    });
  } else {
    console.log('You must be connected to a server to send messages.');
  }
}
