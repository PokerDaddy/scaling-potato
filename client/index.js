// New client start file
// by PokerDaddy

const network = require('./network.js');
const Display = require('./interface.js');

const dis = new Display;

let currentServer = null;
let currentSession = null;

dis.on('input', (line) => {

});

function loginToServer(server, nick) {
  console.log('Logging into: ' + server);
  let serverUrl = `http://${server}:8080`;
  currentServer = serverUrl;
  network.login(serverUrl, nick).on('login', (session) => {
    console.log('Your are now logged in as: ' + session.nick + ':' + session.id);
    currentSession = session;
  }).on('error', (error) => {
    console.log('Login error.');
  });
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

function sendPrivateMessageByNick(recipient, message) {
  network.getUsers(server, {
    nick: recipient
  }).on('users', (users) => {
    if (users && users.length > 0) {
      if (users.length > 1) {
        console.log('Found ' + users.length + ' users with the nick: ' + recipient);
      }
      users.forEach((user) => {
        network.sendDirectMessage(server, session, user.id, message).on('response', (messageObj) => {
          console.log('You sent to [' + user.nick + ':' + user.id + ']: ' + message);
        }).on('error', (error) => {
          console.log('Error sending to: ' + user.nick + ':' + user.id);
        });
      });
    }
  }).on('error', (error) => {
    console.log('Error getting users from the server.');
  });
}

function sendPrivateMessageById(recipientId, message) {
  network.sendDirectMessage(server, session, recipientId, message).on('response', (messageObj) => {
    network.getUser(server, {
      id: recipientId
    }).on('user', (user) => {
      console.log('You sent to [' + user.nick + ';' + user.id + ']: ' + message);
    }).on('error', (error) => {
      console.log('You sent to [' + recipientId + '] (they might not exist): ' + message);
    });
  }).on('error', (error) => {
    console.log('Error sending to: ' + recipientId);
  });
}
