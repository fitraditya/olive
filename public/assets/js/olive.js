var pc
var pcs
var peers
var signal
var mainView
var localView
var localStream
var remoteViews

var iceConfig = {
  'iceServers': [
    {
      'url': 'stun:mmt-stun.verkstad.net'
    },
    {
      'url': 'turn:mmt-turn.verkstad.net',
      'username': 'webrtc',
      'credential': 'secret'
    }
  ]
}

function createRemoteView (id) {
  return '<div class="col-xs-4"><div class="embed-responsive embed-responsive-4by3 remoteView"><video id="remoteView-' + id + '" autoplay muted></div></div>'
}

window.webkitURL = window.webkitURL || window.URL
window.webkitRTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate
navigator.webkitGetUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia

$(function () {
  pcs = {}
  peers = {}

  mainView = $('#mainView')
  localView = $('#localView')
  remoteViews = $('#remoteViews')

  $('#sessionId').val(window.location)

  navigator.webkitGetUserMedia({ 'audio': true, 'video': true }, function (stream) {
    localView.attr('src', URL.createObjectURL(stream))
    localStream = stream

    peerJoin()
  }, logError)
})

function peerJoin () {
  var path = window.location.pathname.split('/')
  var sessionId = path[2]

  signal = new Signal(sessionId)

  signal.onpeer = function (event) {
    var id = event.id
    var peer = event.peer
    var join = event.join

    peer.onmessage = function(event) {
      var message = JSON.parse(event.data)

      if (!pc && (message.sdp || message.candidate)) {
        start(false, event.id)
        console.log('Accept peer ' + event.id)
      }

      if (message.sdp) {
        var description = new RTCSessionDescription(message.sdp)

        pcs[id].setRemoteDescription(description, function () {
          if (pcs[id].remoteDescription.type === 'offer') {
            pcs[id].createAnswer(function (description) {
              pcs[id].setLocalDescription(description, function () {
                peer.send(id, JSON.stringify({ 'sdp': pcs[id].localDescription }))
              }, logError)
            }, logError)
          }
        }, logError)
      } else {
        pcs[id].addIceCandidate(new RTCIceCandidate(message.candidate), function () {
          //
        }, logError)
      }
    }

    peer.ondisconnect = function (event) {
      if (pcs[id]) {
        pcs[id].close()
      }

      pcs[id] = null

      $('#remoteView-' + id).remove()
      if (mainView.attr('data-id') === id) {
        mainView.attr('src', localView.attr('src'))
      }

      console.log(id + ' leave session')
    }

    peers[peer.id] = peer

    if (join) {
      start(true, peer.id)
      console.log('Calling peer ' + peer.id)
    }
  }
}

function start (isInitiator, id) {
  var id = id
  var peer = peers[id]

  if (!pcs[id]) {
    pcs[id] = new webkitRTCPeerConnection(iceConfig)

    pcs[id].onicecandidate = function (event) {
      if (event.candidate) {
        peer.send(id, JSON.stringify({ 'candidate': event.candidate }))
      }
    }

    pcs[id].onnegotiationneeded = function () {
      if (pcs[id].signalingState === 'stable') {
        pcs[id].createOffer(function (description) {
          pcs[id].setLocalDescription(description, function () {
            peer.send(id, JSON.stringify({ 'sdp': pcs[id].localDescription }))
          }, logError)
        }, logError)
      }
    }

    pcs[id].onaddstream = function (event) {
      remoteViews.append(createRemoteView(id))
      $('#remoteView-' + id).attr('data-id', id)
      $('#remoteView-' + id).attr('src', URL.createObjectURL(event.stream))

      if (!mainView.attr('src')) {
        mainView.attr('data-id', id)
        mainView.attr('src', URL.createObjectURL(event.stream))
      }
    }

    pcs[id].addStream(localStream)
  }
}

function logError (error) {
  if (error) {
    if (error.name && error.message) {
      console.log(error.name + ': ' + error.message)
    } else {
      console.log(error)
    }
  } else {
    console.log('Error (no error message)')
  }
}
