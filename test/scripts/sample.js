// the purpose of this timer is to keep the child process running long enough
// for the calling code to recognize that it has started
global.setTimeout(() => {
  // no-op
}, 500)

console.log('ready for testing!')
console.log('this will appear on stdout')
console.error('this will appear on stderr')
