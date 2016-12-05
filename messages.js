const loki = require("lokijs");

let db = new loki("data.js");
let messages = db.addCollection("messages");

let _exports = module.exports = {};

_exports.store_message = function (msg) {
	messages.insert(msg);
}

_exports.get_messages = function (timestamp) {
	return messages.find( {"time" : {"$gte" : timestamp} } );
}
