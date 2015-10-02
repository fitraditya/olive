var _ = require('lodash-node')

var users = []

exports.register = function (server, options, next) {
  var io = require('socket.io')(server.select('signal').listener)

  io.on('connection', function (socket) {

    socket.on('register', function (data) {
      if (_.findIndex(users, { socket: socket.id }) !== -1) {
        socket.emit('register_error', { message: 'You are already registered.' })
        return
      }

      if (_.findIndex(users, { session: data.session }) !== -1) {
        socket.emit('register_error', { message: 'This session already exists.' })
        return
      }

      users.push({
        socket: socket.id,
        session: data.session
      })

      socket.emit('registered', {
        id: socket.id,
        session: data.session,
        users: _.pluck(users, 'name')
      })

      console.log('- ' + data.session + ' registered')
    })

    socket.on('message', function (data) {
      var user = _.find(users, { socket: socket.id })
      if (!user) { return }

      var contact = _.find(users, { session: data.session })
      if (!contact) { return }

      io.to(contact.socket).emit('message', {
        from: user.session,
        message: data.message
      })
    })

    socket.on('disconnect', function () {
      var index = _.findIndex(users, { socket: socket.id })

      if (index !== -1) {
        users.splice(index, 1)

        console.log('- ' + users[index].session + ' disconnected.')
      }
    })

  })

  next()
}

exports.register.attributes = {
  name: 'olive-signal'
}
