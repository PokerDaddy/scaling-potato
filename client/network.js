// sends messages to server

const request = require('request');
const Callback = require('events');

class LoginCallback extends Callback {}
class SendMessageCallback extends Callback {}
class UpdateCallback extends Callback {}
class GetUsersCallback extends Callback {}
class GetUserCallback extends Callback {}
class NickChangeCallback extends Callback {}

function login(server, nick) {
  let callback = new LoginCallback();

  request.post(server + '/login', {
    json: {
      nick
    }
  }, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
      return;
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
      return;
    }
    callback.emit('response', body);
  });

  return callback;
}

function sendDirectMessage(server, session, recipientId, body) {
  let callback = new SendMessageCallback();

  request.post(server + '/direct/' + recipientId, {
    json: {
      token: session.token,
      body
    }
  }, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
      return;
    }
    callback.emit('response', body);
  });

  return callback;
}

function getUsers(server, userData) {
  let callback = new GetUsersCallback();

  request.post(server + '/users', {
    json: userData
  }, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
      return;
    }
    callback.emit('users', body);
  });

  return callback;
}

function getUser(server, userData) {
  let callback = new GetUserCallback();

  request.post(server + '/user', {
    json: userData
  }, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
      return;
    }
    callback.emit('user', body);
  });

  return callback;
}

function update(server, timestamp) {
  let callback = new UpdateCallback();

  request.get(server + '/update/' + timestamp, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
      return;
    }
    callback.emit('response', JSON.parse(body));
  });

  return callback;
}

function updateDirects(server, session, timestamp) {
  let callback = new UpdateCallback();

  request.post(server + '/direct', {
    json: {
      token: session.token,
      timestamp
    }
  }, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
      return;
    }
    callback.emit('response', body);
  });

  return callback;
}

function changeNickname(server, newSession) {
  let callback = new NickChangeCallback();

  request.post(server + '/profile', {
    json: newSession
  }, (error, res, body) => {
    if (error) {
      callback.emit('error', error);
      return;
    }
    callback.emit('response', body);
  });

  return callback;
}

module.exports = {
  login,
  sendMessage,
  sendDirectMessage,
  getUsers,
  getUser,
  update,
  updateDirects,
  changeNickname
}
