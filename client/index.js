exports.register = function (server, options, next) {
  server.route([
    {
      method: 'GET',
      path: '/',
      config: {
        handler: function(request, reply) {
          reply.file('public/index.html')
        }
      }
    },
    {
      method: 'GET',
      path: '/s/{session?}',
      config: {
        handler: function(request, reply) {
          reply.file('public/session.html')
        }
      }
    },
    {
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: 'public/assets',
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
