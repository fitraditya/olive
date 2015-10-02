exports.register = function (server, options, next) {
  server.route([
    {
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: 'public',
          listing: false
        }
      }
    }
  ])

  next()
}

exports.register.attributes = {
  name: 'olive-client'
}
