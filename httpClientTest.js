const request = require('request');

console.log('Sending request');
request('http://localhost:8123/', (error, res, body) => {
  console.log('Got a response: ' + body);
});
