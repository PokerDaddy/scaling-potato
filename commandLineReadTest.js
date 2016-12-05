process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  console.log('Got: ' + chunk);
  if (chunk === 'quit\n') {
    process.exit(0);
  }
});
