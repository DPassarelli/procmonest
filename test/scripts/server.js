const http = require('http')

const server = http.createServer((req, res) => {
  console.log('incoming message', req.method, req.url)

  const envars = JSON.stringify(process.env)

  res.writeHead(
    200,
    {
      'content-type': 'application/json',
      'content-length': envars.length
    }
  )
    .end(envars)
})

server.listen(() => {
  console.log('ready for incoming messages on port', server.address().port)
})
