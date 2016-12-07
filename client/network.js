// sends messages to server

const request = require('request');
const Callback = require('events');

class LoginCallback extends Callback {}
class SendMessageCallback extends Callback {}
class UpdateCallback extends Callback {}

function login(server, nick) {
  let callback = new LoginCallback();

  request.post(server + '/login', {
    json: {
      nick
    }
  }, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
    }
    // body is already parsed because of json arg
    callback.emit('login', body);
  });

  return callback;
}

function sendMessage(server, session, body) {
  let callback = new SendMessageCallback();

  request.post(server + '/send', {
    json: {
      token: session.token,
      body
    }
  }, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
    }
    callback.emit('response', body);
  });

  return callback;
}

function update(server, timestamp) {
  let callback = new UpdateCallback();

  request.get(server + '/update/' + timestamp, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
    }
    callback.emit('response', JSON.parse(body));
  });

  return callback;
}

module.exports = {
  login,
  sendMessage,
  update
}
