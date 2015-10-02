var fs = require('fs')
var url = require('url')
var http = require('http')
var mime = require('mime')
var path = require('path')
var static = require('node-static')

var sessions = {}
var maxUsers = 4

var port = process.env.PORT || 4567

var client = path.join(path.dirname(__filename), 'public/')

var server = http.createServer(function (request, response) {
  var headers = {
    'Cache-Control': 'no-cache, no-store',
    'Pragma': 'no-cache',
    'Expires': '0'
  }

  var segments = request.url.split('/')

  if (segments[1] === 'request' || segments[1] === 'response') {
    var _sessionId = segments[2]
    var _userId = segments[3]

    if (!_sessionId || !_userId) {
      response.writeHead(401)
      response.end
      return
    }

    if (segments[1] === 'request') {
      var _peer
      var _peerId = segments[4]
      var _session = sessions[_sessionId]

      if (!_session || !(_peer = _session.users[_peerId])) {
        console.log('boom')
        response.writeHead(401)
        response.end()
        return
      }

      var body = ''

      request.on('data', function (data) {
        body = body + data
      })

      request.on('end', function () {
        var event = 'data:' + body.replace(/\n/g, "\n" + 'data:') + "\n"

        _peer.response.write('event:user-' + _userId + "\n" + event + "\n")
        
        console.log('@' + _sessionId + ' - ' + _userId + ' => ' + _peerId + '.')
      })

      headers['Content-Type'] = 'text/event-stream'

      response.writeHead(204, headers)
      response.end()
    } else if (segments[1] === 'response') {
      console.log('@' + _sessionId + ' - ' + _userId + ' joined.')

      headers['Content-Type'] = 'text/event-stream'

      response.writeHead(200, headers)
      
      function keepAlive (res) {
        res.write(":\n")
        res.keepAliveTimer = setTimeout(arguments.callee, 30000, res)
      }
      keepAlive(response)

      var _session = sessions[_sessionId]

      if (!_session) {
        _session = sessions[_sessionId] = {
          'users': {}
        }
      }

      if (Object.keys(_session.users).length > maxUsers - 1) {
        response.write('event:full' + "\n" + 'data:' + _sessionId + "\n\n")

        clearTimeout(response.keepAliveTimer)
        response.end()
        return
      }

      var _user = _session.users[_userId]

      if (!_user) {
        _user = _session.users[_userId] = {}

        for (var _id in _session.users) {
          var res = _session.users[_id].response

          if (res) {
            clearTimeout(res.keepAliveTimer)
            keepAlive(res)

            response.write('event:join' + "\n" + 'data:' + _id + "\n\n")
            res.write('event:join' + "\n" + 'data:' + _userId + "\n\n")
            console.log(_id + ' ' + _userId)
          }
        }
      } else if (_user.response) {
        _user.response.end()
        clearTimeout(_user.response.keepAliveTimer)
        _user.response = null
      }

      _user.response = response
      
      request.on('close', function () {
        for (var _id in _session.users) {
          if (_id === _userId) {
            continue
          }

          var res = _session.users[_id].response

          res.write('event:leave' + "\n" + 'data:' + _userId + "\n\n")
        }
      })      
    }

    return
  }

  route(request, response)
})

function route (req, res) {
  var segments = req.url.split('/')

  switch (segments[1]) {
    case '':
      displayPage('/index.html', req, res)
      break
    case 's':
      displayPage('/session.html', req, res)
      break
    default:
      var file = new static.Server('./public')
      file.serve(req, res)
  }

  return
}

function displayPage (uri, req, res) {
  file = path.join(client, uri)

  fs.stat(file, function (error, stats) {
    if (error || !stats.isFile()) {
      res.writeHead(404)
      res.end()
      return
    }

    fs.readFile(file, 'binary', function(error, resource) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.write(resource, 'binary')
      res.end()
    })
  })
}

server.listen(port)

console.log('Server is running on port ' + port)
