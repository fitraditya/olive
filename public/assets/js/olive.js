var pc
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

    peer.onmessage = function(event) {
      console.log(event)
      var message = JSON.parse(event.data)

      if (!pc && (message.sdp || message.candidate)) {
        start(false, event.id)
        console.log('As participant')
      }

      if (message.sdp) {
        var description = new RTCSessionDescription(message.sdp)

        pc.setRemoteDescription(description, function () {
          if (pc.remoteDescription.type === 'offer') {
            pc.createAnswer(function (description) {
              pc.setLocalDescription(description, function () {
                peer.send(id, JSON.stringify({ 'sdp': pc.localDescription }))
              }, logError)
            }, logError)
            console.log('Send answer')
          }
        }, logError)
      } else {
        pc.addIceCandidate(new RTCIceCandidate(message.candidate), function () {
          //
        }, logError)
      }
    }

    peer.ondisconnect = function (event) {
      console.log(event)
      //if (pc) {
      //  pc.close()
      //}

      //pc = null
    }

    peers[peer.id] = peer

    if (sessionStorage.getItem('isInisiator')) {
      start(true, peer.id)
      console.log('As initiator')
    }
  }
}

function start (isInitiator, id) {
  var id = id
  var peer = peers[id]

  pc = new webkitRTCPeerConnection(iceConfig)

  pc.onicecandidate = function (event) {
    if (event.candidate) {
      peer.send(id, JSON.stringify({ 'candidate': event.candidate }))
      console.log('Send candidate')
      console.log(event.candidate)
    }
  }

  pc.onnegotiationneeded = function () {
    if (pc.signalingState === 'stable') {
      pc.createOffer(function (description) {
        pc.setLocalDescription(description, function () {
          peer.send(id, JSON.stringify({ 'sdp': pc.localDescription }))
        }, logError)
      }, logError)
      console.log('Send offer')
    }
  }

  pc.onaddstream = function (event) {
    remoteViews.append(createRemoteView(id))
    $('#remoteView-' + id).attr('data-id', id)
    $('#remoteView-' + id).attr('src', URL.createObjectURL(event.stream))

    if (Object.keys(peers).length === 1) {
      mainView.attr('src', URL.createObjectURL(event.stream))
    }
  }

  pc.addStream(localStream)
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
