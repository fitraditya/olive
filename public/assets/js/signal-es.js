function Signal (sessionId) {
  if (!sessionId) {
    var path = window.location.pathname.split('/')

    sessionId = path[2] || generateId()
  }

  var userId = generateId()

  var channels = {}
  var listeners = {
    'onpeer': null,
    'onsessionfull': null
  }

  for (var name in listeners) {
    Object.defineProperty(this, name, createEventListenerDescriptor(name, listeners))
  }

  var es = new EventSource('/response/' + sessionId + '/' + userId)

  es.onerror = function () {
    es.close()
  }

  es.addEventListener('join', function (event) {
    var peerId = event.data
    var channel = new PeerChannel(peerId)

    channels[peerId] = channel

    console.log('user-' + peerId)
    es.addEventListener('user-' + peerId, peerHandler, false)
    fireEvent({ 'type': 'peer', 'id': peerId, 'peer': channel }, listeners)
  }, false)

  es.addEventListener('leave', function (event) {
    var peerId = event.data

    es.removeEventListener('user-' + peerId, peerHandler, false)
    channels[peerId].didLeave(peerId)

    delete channels[peerId]
  }, false)

  es.addEventListener('full', function () {
    fireEvent({ 'type': 'sessionfull' }, listeners)
    es.close()
  }, false)

  function generateId () {
    return Math.random().toString(16).substr(2)
  }

  function peerHandler (event) {
    var peerId = event.type.substr(5)
    var channel = channels[peerId]
    
    if (channel) {
      console.log('peering ' + peerId)
      channel.didGetData(event.data)
    }
  }

  function PeerChannel (peerId) {
    var listeners = {
      'onmessage': null,
      'ondisconnect': null
    }

    for (var name in listeners) {
      Object.defineProperty(this, name, createEventListenerDescriptor(name, listeners))
    }

    this.didGetData = function (data) {
      fireEvent({ 'type': 'message', 'id': peerId, 'data': data }, listeners)
    }

    this.didLeave = function (peerId) {
      fireEvent({ 'type': 'disconnect', 'id': peerId }, listeners)
    }

    var sendQueue = []

    function processSendQueue() {
      var xhr = new XMLHttpRequest()

      xhr.open('POST', '/request/' + sessionId + '/' + userId + '/' + peerId)
      xhr.setRequestHeader('Content-Type', 'text/plain')
      xhr.send(sendQueue[0])
      xhr.onreadystatechange = function () {
        if (xhr.readyState == xhr.DONE) {
          sendQueue.shift()

          if (sendQueue.length > 0) {
            processSendQueue()
          }
        }
      }
    }

    this.send = function (message) {
      if (sendQueue.push(message) == 1) {
        processSendQueue()
      }
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
