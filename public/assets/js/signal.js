var Signal = function (sessionId) {
  if (!sessionId) {
    window.location = '../'
  }

  var myId = null
  var peers = {}

  var socket = io('//localhost:4567')

  var listeners = {
    'onpeer': null,
    'onsessionfull': null
  }

  for (var name in listeners) {
    Object.defineProperty(this, name, createEventListenerDescriptor(name, listeners))
  }

  socket.on('connect', function () {
    console.log('Connected to signaling server.')
  })

  socket.on('disconnect', function () {
    console.log('Disconnected from signaling server.')
  })

  socket.emit('register', {
    session: sessionId,
    isInitiator: sessionStorage.getItem('isInisiator') || false
  });

  socket.on('registered', function (data) {
    myId = data.socket
    console.log('Registered as ' + data.socket + ', session ' + data.session + '.')
    
    data.users.forEach(function (user) {
      if (user !== myId) {
        var id = user
        var peer = new Peer(id)
        
        peers[id] = peer
        fireEvent({
          type: 'peer',
          id: id,
          peer: peer,
          join: true
        }, listeners)

        socket.emit('invite', {
          target: user
        })
      }
    })
  })

  socket.on('invited', function (data) {
    var id = data.id
    var peer = new Peer(id)
    
    peers[id] = peer
    fireEvent({
      type: 'peer',
      id: id,
      peer: peer,
      join: false
    }, listeners)
  })

  socket.on('message', function (data) {
    var id = data.id
    var message = data.message
    
    peerHandler(id, message)
  })

  function Peer (id) {
    var listeners = {
      'onmessage': null,
      'ondisconnect': null
    }

    for (var name in listeners) {
      Object.defineProperty(this, name, createEventListenerDescriptor(name, listeners))
    }

    this.id = id

    this.didMessage = function (id, data) {
      fireEvent({ 'type': 'message', 'id': id, 'data': data }, listeners)
    }

    this.didDisconnect = function () {
      fireEvent({ 'type': 'disconnect', 'id': id }, listeners)
    }

    this.send = function (id, message) {
      socket.emit('message', {
        target: id,
        message: message
      })
    }
  }

  function peerHandler (id, message) {
    var peer = peers[id]
    
    if (peer) {
      peer.didMessage(id, message)
    }
  }

  function createEventListenerDescriptor (name, listeners) {
    return {
      'get': function () { return listeners[name] },
      'set': function (cb) { listeners[name] = cb instanceof Function ? cb : null },
      'enumerable': true
    }
  }

  function fireEvent (event, listeners) {
    var listener = listeners['on' + event.type]

    if (listener) {
      listener(event)
    }
  }
}
