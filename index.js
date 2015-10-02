var Hapi = require('hapi')

var server = new Hapi.Server()

server.connection({ port: 4567, labels: ['signal'] })
server.connection({ port: 8000, labels: ['client'] })
server.register([
  require('./signal'),
  require('inert'),
  require('./client')
], function (error) {
  if (error) {
    throw error
  }

  server.start(function () {
    console.log('Server started at: ' + server.info.uri + '.')
  })
})
