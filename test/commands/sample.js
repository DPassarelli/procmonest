process.once('SIGINT', () => {
  console.log('received SIGINT')
  process.exit()
})

global.setTimeout(() => {
  console.log('timed out')
}, 5000)

console.log('ready')
