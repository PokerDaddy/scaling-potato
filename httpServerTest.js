const express = require('express');

let app = express();

app.get('/', (req, res) => {
  console.log('Got a request');
  return res.send('this is some message');
});

app.listen(8123);
