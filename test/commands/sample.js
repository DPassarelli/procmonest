// the purpose of this timer is to keep the child process running long enough
// for the calling code to recognize that it has started
global.setTimeout(() => {
  // no-op
}, 1000)

console.log('ready')
