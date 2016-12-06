const express = require('express');
const db = require('./database.js');
const body_parser = require('body-parser');

let app = express();
app.use(body_parser.json())

app.get('/update/:time', (req, res) => {
	let time = req.params.time;
	
	res.send( db.get_messages(time) );
});

app.post('/send', (req, res) => {
	let msg = req.body;

	console.log(msg);

	if ( db.store_message( msg ) === false ) {
		res.status(400)
		res.send("Invalid token")
	}
});

app.post('/login', (req, res) => {
	let session = req.body;
	db.generate_session(session);
	
	res.send(JSON.stringify(session));
});

app.listen(8080);
