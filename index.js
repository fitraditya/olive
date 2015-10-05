var Hapi = require('hapi')
var Config = require('./config')

var server = new Hapi.Server()

server.connection({ port: Config.server.port, labels: ['signal'] })
server.register([
  require('./signal')
], function (error) {
  if (error) {
    throw error
  }
})

if (Config.client.enable) {
  server.connection({ port: Config.client.port, labels: ['client'] })
  server.register([
    require('inert'),
    require('./client')
  ], function (error) {
    if (error) {
      throw error
    }
  })
}

server.start(function () {
  console.log('Server started at: ' + server.info.uri + '.')
})
