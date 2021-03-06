const express = require('express');
const db = require('./database.js');
const body_parser = require('body-parser');

let app = express();
app.use(body_parser.json())

app.get('/update/:time', (req, res) => {
	let time = req.params.time;

	res.send(db.get_messages(time));
});

app.post('/send', (req, res) => {
	let msg = req.body;

	console.log(msg);

	msg = db.store_message(msg)

	if (!msg) {
		return res.status(400).send("Invalid token");
	}
	return res.send();
});

app.post('/direct/:userid', (req, res) => {
	let msg = req.body;

	console.log(msg);

	if (!db.store_direct(msg, req.params.userid)) {
		return res.status(400).send("Invalid token");
	}
	return res.send();
});

app.post('/direct', (req, res) => {
	let obj = req.body;
	
	let msg = db.get_direct(obj);

	if (!msg) {
		return res.status(400).send("Invalid token");
	}
	return res.send(msg);
});

app.post('/login', (req, res) => {
	let session = req.body;
	db.generate_session(session);

	res.send(JSON.stringify(session));
});

app.get('/login', (req, res) => {
	let session = {
	  nick: 'guest'
	};
	db.generate_session(session);

	res.send(JSON.stringify(session));
});

app.post('/user', (req, res) => {
	let session = req.body;

	res.send( db.find_session(session) );
});

app.post('/users', (req, res) => {
	let session = req.body;

	res.send( db.find_sessions(session) );
});

app.post('/profile', (req, res) => {
	let ret = db.update_session(req.body);

	if (!ret) {
		return res.status(400).send("Invalid token");
	}
	return res.send(
			db.get_session(req.body.token)
		);
});

console.log( "Admin Token:", db.generate_system() );

app.listen(8080);
