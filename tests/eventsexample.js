const Event = require('events');

class MyEvent extends Event {

}

function doSomething() {
  let callback = new MyEvent();

  // runs after this method has returned
  setImmediate(() => {
    callback.emit('some-event', 'Hello', 'World');
  });

  return callback;
}

doSomething().on('some-event', (arg1, arg2) => {
  console.log(arg1);
  console.log(arg2);
});
