const loki = require("lokijs");

let db = new loki("data.json");
let messages = db.addCollection("messages");
let sessions = db.addCollection("sessions");

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
 * Clean a list of messages
 * 
 * @private
 * @param {array} msg - Messages to be cleaned
 * @returns {array} Cleaned list of messages
 */
function clean_messages(msg) {
	let new_messages = [];

	msg.forEach( (item) => {
		item = clone(item);

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

	if (session === false) {
		return false;
	}

	console.log(session);

	msg = clone(msg);

	msg = Object.assign(session, msg);

	messages.insert( clean_message(msg) );
}

/**
 * Get messages since a timestamp
 * 
 * @public
 * @param {number} timestamp - Timestamp from which to select
 * @returns {array} All messages sent since the timestamp
 */
_exports.get_messages = function (timestamp) {
	return clean_messages( clone( messages.find( {"timestamp" : {"$gt" : timestamp} } ) ) );
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
 * Register a user in the database
 *
 * @public
 * @param {object} session - Session to be registered
 * @returns {string} Token for the new user
 */
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

/**
 * Update the data for a given user
 *
 * @public
 * @param {object} user - Edited user object
 */
_exports.update_session = function (user) {
	let token = user.token;
	let session = sessions.find( { token : token} );
	let old = clone(session);

	if ( session.length === 0 ) {
		return false;
	}

	session = session[0];

	for (var attrname in user) { session[attrname] = user[attrname]; }

	// send notification of user update

	let updated = _exports.get_session(token);
	updated.old = old;
	updated.body = "User data updated";

	_exports.store_message(updated);
}
