// the purpose of this timer is to keep the child process running long enough
// for the calling code to recognize that it has started
global.setTimeout(() => {
  console.log('timer')
}, 1000)

process.once('SIGINT', () => {
  console.log('SIGINT received')
})

console.log('ready')
