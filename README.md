# Olive
One click video call on the web

## Features
* Group Video Call
* Group Text Chat (next)
* Screen Sharing (next)

## Installation
```
$ git clone https://github.com/fitraditya/olive.git
$ cd olive
$ npm install
$ npm start
```

## Configuration
You can set server port on `config.js`.
```javascript
module.exports = {
  server: {
    port: 4567
  },
  client: {
    enable: true,
    port: 8000
  }
}
```

### Enable Web Client
Olive comes with web client. It serves with different port. You can choose whether to enable it or not in `config.js`.

## To Do
* Add group text chat using data channel
* Add screen sharing feature
* Mobile phone support (cordova plugin and native sdk)

## Maintainer
Fitra Aditya <fitra@g.pl>

## License
MIT
