process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (text) => {
  console.log('Got: ' + text);
  if (text === 'quit\n') {
    process.exit(0);
  }
});
