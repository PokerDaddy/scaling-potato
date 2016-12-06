const loki = require("lokijs");

let db = new loki("data.json");
let messages = db.addCollection("messages");
let sessions = db.addCollection("sessions");

let _exports = module.exports = {};

function clone(obj) {
	return JSON.parse( JSON.stringify(obj) );
}

function clean_message(msg) {
	msg = clone(msg);

	delete msg.secret;
	msg.timestamp = (new Date()).getTime() / 1000;
	return msg;
}

_exports.clean_object = function (obj) {
	obj = clone(obj);
	
	delete obj.meta;
	delete obj["$loki"];
	
	return obj;
}

_exports.store_message = function (msg) {
	let session = _exports.get_session(msg.token);

	if (session === false) {
		return false;
	}

	delete session.token;

	msg = Object.assign(session, msg);

	messages.insert( clean_message(msg) );
}

_exports.get_messages = function (timestamp) {
	return messages.find( {"time" : {"$gte" : timestamp} } );
}

_exports.get_session = function (token) {
	let session = sessions.find( {"token" : token} );

	if ( session.length === 0 ) {
		return false;
	}

	session = clone(session[0])

	delete session.token;

	return _exports.clean_object(session);
}

_exports.generate_session = function (session) {
	token = require('crypto').randomBytes(64).toString('hex');
	
	if ( _exports.get_session(token).length > 0 ) {
		return _exports.generate_session(session);	
	}
	
	id = require('crypto').randomBytes(16).toString('hex');

	session.token = token;
	session.id = id;
	
	sessions.insert( session );

	return token;
}
