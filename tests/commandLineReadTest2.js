const readline = require('readline');

const cli = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

cli.on('line', (line) => {
  console.log('New line: ' + line);
  process.stdout.write('> ');
}).on('SIGINT', () => {
  console.log('\nQuitting...');
  process.exit(0);
});

cli.question('Username: ', (response) => {
  console.log('Your username is: ' + response);
  process.stdout.write('> ');
});
