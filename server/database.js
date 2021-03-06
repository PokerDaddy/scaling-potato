const loki = require("lokijs");
const crypto = require("crypto");

let db = new loki("data.json");
let messages = db.addCollection("messages");
let sessions = db.addCollection("sessions");
let direct = db.addCollection("direct");

let _exports = module.exports = {};

/**
 * Clone an object
 * This is rather hacky
 * 
 * @private
 * @param {object} obj - The object to clone
 * @returns {obj} Cloned object
 */
function clone(obj) {
	return JSON.parse( JSON.stringify(obj) );
}

/**
 * Prepare a message for storage
 * 
 * @private
 * @param {object} msg - Message to be cleaned
 * @returns {object} Cleaned message
 */
function clean_message(msg) {
	msg = clone(msg);

	delete msg.secret;
	msg.timestamp = Math.floor( (new Date()).getTime() / 1000 );
	return msg;
}

/**
 * Check if a given message is to a given id/since a given time
 *
 * @private
 * @decorator
 * @param {string} id - ID of the user to check 
 * @param {number} timestamp - Timestamp after which to fetch
 * @returns {function} Wrapped function for LokiJS
 */
function filter_messages(id, timestamp)  {
	/**
	 * Wrapped function to check if a given function matches the parent's
	 * specifications.
	 *
	 * @private
	 * @function
	 * @param {object} msg - Message to be filtered
	 * @returns {boolean} Whether the message matches the query
	 */
	return function(msg) {
		return (msg.to === id && msg.timestamp > timestamp);
	}
}

/**
 * Clean a list of messages
 * 
 * @private
 * @param {array} msg - Messages to be cleaned
 * @returns {array} Cleaned list of messages
 */
function clean_messages(msg) {
	let new_messages = [];

	msg = clone(msg)

	msg.forEach( (item) => {
		delete item.token;

		new_messages.push( _exports.clean_object(item) );
	});
	
	return new_messages;
}

/**
 * Strip database information from an object
 * 
 * @public
 * @param {object} obj - Object to be cleaned
 * @returns {object} The cleaned object
 */
_exports.clean_object = function (obj) {
	obj = clone(obj);
	
	delete obj.meta;
	delete obj["$loki"];
	
	return obj;
}

/**
 * Save a message to the database
 *
 * @public
 * @param {object} msg - Message to be sent
 */
_exports.store_message = function (msg) {
	let session = _exports.get_session(msg.token);

	if (!session) {
		return false;
	}

	console.log(session);

	msg = clone(msg);

	if (session.id == "0000") {
		msg = Object.assign(session, msg);
	} else {
		msg = Object.assign(msg, session);
	}

	messages.insert( clean_message(msg) );
	
	return msg;
}

/**
 * Get messages since a timestamp
 * 
 * @public
 * @param {number} timestamp - Timestamp from which to select
 * @returns {array} All messages sent since the timestamp
 */
_exports.get_messages = function (timestamp) {
	return clean_messages( messages.find( {"timestamp" : {"$gt" : timestamp} } ) );
}

/**
 * Send a direct message
 *
 * @public
 * @param {object} msg - Message to be sent
 * @param {string} to - userid of user to be sent to
 */
_exports.store_direct = function (msg, to) {
	let session = _exports.get_session(msg.token);

	if (!session) {
		return false;
	}

	console.log(session);

	msg = clone(msg);

	if (session.id == "0000") {
		msg = Object.assign(session, msg);
	} else {
		msg = Object.assign(msg, session);
	}

	msg.to = to;

	direct.insert( clean_message(msg) );

	return msg;
}

/**
 * Get direct messages
 *
 * @public
 * @param {object} req - Object containing token and timestamp
 * @returns {array} All matching messages
 */
_exports.get_direct = function (req) {
	let session = _exports.get_session(req.token);

	if (!session) { 
		return false;
	}

	return clean_messages(clone(direct.where(
		filter_messages(session.id, req.timestamp))));
}

/**
 * Find a user by its token
 *
 * @public
 * @param {string} token - Token to select by
 * @returns {object} First matching session
 */
_exports.get_session = function (token) {
	return _exports.find_session( { token : token } );
}

/**
 * Find a user with an arbitrary query
 *
 * @public
 * @param {object} obj - Query to select by
 * @returns {object} First matching session
 */
_exports.find_session = function (obj) {
	let session = sessions.find( obj );

	if ( session.length === 0 ) {
		return false;
	}

	session = clone(session[0])

	delete session.token;

	return _exports.clean_object(session);
}

/**
 * Find a list of users with an arbitrary query
 *
 * @public
 * @param {object} obj - Query to select by
 * @returns {array} All matching sessions
 */
_exports.find_sessions = function (obj) {
	let session = sessions.find(obj);

	session = clean_messages(session);

	return session;
}

/**
 * Register a user in the database
 *
 * @public
 * @param {object} session - Session to be registered
 * @returns {string} Token for the new user
 */
_exports.generate_session = function (session) {
	token = crypto.randomBytes(64).toString('hex');
	
	if ( _exports.get_session(token).length > 0 ) {
		return _exports.generate_session(session);	
	}
	
	let id = crypto.randomBytes(2).toString('hex');

	session.token = token;
	session.id = id;

	let dupe = clone(session);

	nick = session.nick;

	sessions.insert( session );

	session = clean_message(dupe);
		
	session.nick = "system";
	session.id = "0000";

	session.body = nick + "#" + id + " joined";

	messages.insert(session);

	return token;
}

/**
 * Generate system user
 *
 * @public
 * @returns {string} Token for system user
 */
_exports.generate_system = function() {
	if ( _exports.find_session( { "id" : "0000" } ) ) {
		return false;
	}

	token = crypto.randomBytes(64).toString('hex');

	let session = {
		token : token,
		nick : "system",
		id : "0000"};

	sessions.insert(session);

	return token;
}

/**
 * Update the data for a given user
 *
 * @public
 * @param {object} user - Edited user object
 */
_exports.update_session = function (user) {
	let token = user.token;
	let session = sessions.find( { token : token} );
	let old = clone(session)[0];

	if ( session.length === 0 ) {
		return false;
	}

	session = session[0];

	if ( session.id === "0000" ) {
		return session;
	}

	for (var attrname in user) { session[attrname] = user[attrname]; }

	// send notification of user update

	let updated = _exports.get_session(token);
	updated.body = old.nick + "#" + old.id + " is now " + updated.nick + "#" + updated.id;
	updated.nick = "system";
	updated.id = "0000";

	messages.insert( clean_message(updated) );

	return updated;
}
