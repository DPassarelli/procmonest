const http = require('http')

const server = http.createServer((req, res) => {
  // do nothing
  res.end()
})

server.listen(() => {
  console.log('ready')
})
