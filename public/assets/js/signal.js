var Signal = function (sessionId) {
  if (!sessionId) {
    window.location = '../'
  }

  var userId = generateId()
  var channels = {}

  var socket = io('//localhost:4567')

  socket.on('connect', function () {
    console.log('Connected to signaling server.')
  })

  socket.on('disconnect', function () {
    console.log('Disconnected from signaling server.')
  })

  socket.emit('register', {
    session: sessionId
  });

  socket.on('registered', function (data) {
    console.log('Registered as ' + data.id + ', session ' + data.session + '.')
    console.log('Available users ' + data.users + '.')
  })

  if (sessionStorage.getItem('isInisiator')) {
    
  }

  function generateId () {
    return Math.random().toString(16).substr(2)
  }
}
