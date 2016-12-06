const loki = require("lokijs");

let db = new loki("data.json");
let messages = db.addCollection("messages");
let sessions = db.addCollection("sessions");

let _exports = module.exports = {};

function clean_message(msg) {
	delete msg.secret;
	msg.timestamp = (new Date()).getTime() / 1000;
}

_exports.store_message = function (msg) {
	messages.insert( clean_message(msg) );
}

_exports.get_messages = function (timestamp) {
	return messages.find( {"time" : {"$gte" : timestamp} } );
}

_exports.get_session = function (token) {
	return sessions.find( {"token" : token} );
}

_exports.generate_session = function (session) {
	token = require('crypto').randomBytes(64).toString('hex');
	
	if ( _exports.get_session(token) ) {
		return _exports.generate_session(session);	
	}
	
	session.token = token;
	
	sessions.insert( session );

	return token;
}
