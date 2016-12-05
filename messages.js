const loki = require("lokijs");

let db = new loki("data.js");
let messages = db.addCollection("messages");

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
