'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (peerConnection, interval, callback) {
  var runStatsLooper = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var results;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return pc.getStats();

            case 2:
              results = _context.sent;

              if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
                shouldStop = true;
              }

              results.forEach(function (result) {
                Object.keys(statsPaser).forEach(function (key) {
                  if (typeof statsPaser[key] === 'function') {
                    statsPaser[key](result);
                  }
                });
              });

              if (shouldStop) {
                statsResult.ended = true;
              }

              statsResult.callTimes += 1;
              statsResult.rawResult = results;

              callback(statsResult);
              interval = interval ? interval : 1000;
              shouldStop || setTimeout(runStatsLooper, interval);

            case 11:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function runStatsLooper() {
      return _ref.apply(this, arguments);
    };
  }();

  var pc = peerConnection;
  var shouldStop = false;

  var statsResult = {
    callTimes: 0,
    ended: false,
    rawResult: {},
    video: {
      send: {
        codecId: '',
        codec: 'video/H264',
        width: 0,
        height: 0,
        fps: 0,
        bytesPersecond: 0
      },
      recv: {
        codecId: '',
        code: 'video/H264',
        width: 0,
        height: 0,
        fps: 0,
        bytesPersecond: 0,
        packetsReceived: 0,
        packetsLost: 0
      },
      bytesSent: 0,
      bytesReceived: 0,
      fractionLost: 0
    },
    audio: {
      send: {
        bytesPersecond: 0
      },
      recv: {
        bytesPersecond: 0
      },
      bytesSent: 0,
      fractionLost: 0,
      bytesReceived: 0,
      jitter: 0
    },
    helper: {
      video: {
        send: {
          preFramesSent: 0
        },
        recv: {
          preFramesReceived: 0
        },
        preBytesSent: 0,
        preBytesReceived: 0
      },
      audio: {
        preBytesSent: 0,
        preBytesReceived: 0
      }
    }
  };

  var statsPaser = {};

  statsPaser.videoTracks = function (result) {
    if (!result.frameHeight || result.frameHeight <= 0) return;
    if (result.ended || result.detached) return;

    if (result.remoteSource) {
      statsResult.video.recv.height = result.frameHeight;
      statsResult.video.recv.width = result.frameWidth;
      statsResult.video.recv.fps = (result.framesReceived - statsResult.helper.video.recv.preFramesReceived) / (interval / 1000);
      statsResult.helper.video.recv.preFramesReceived = result.framesReceived;
    } else {
      statsResult.video.send.height = result.frameHeight;
      statsResult.video.send.width = result.frameWidth;
      statsResult.video.send.fps = (result.framesSent - statsResult.helper.video.send.preFramesSent) / (interval / 1000);
      statsResult.helper.video.send.preFramesSent = result.framesSent;
    }
  };

  statsPaser.inbounds = function (result) {
    if (result.type !== 'inbound-rtp') return;
    var streamType = result.id.split('_')[0];

    if (streamType === 'RTCInboundRTPVideoStream') {

      statsResult.video.fractionLost = result.fractionLost;
      statsResult.video.bytesReceived = result.bytesReceived;
      statsResult.video.recv.codecId = result.codecId;
      statsResult.video.recv.packetsReceived = result.packetsReceived;
      statsResult.video.recv.packetsLost = result.packetsLost;
      statsResult.video.recv.bytesPersecond = (result.bytesReceived - statsResult.helper.video.preBytesReceived) / (interval / 1000);
      statsResult.helper.video.preBytesReceived = result.bytesReceived;
    } else if (streamType === 'RTCInboundRTPAudioStream') {

      statsResult.audio.fractionLost = result.fractionLost;
      statsResult.audio.jitter = result.jitter;
      statsResult.audio.bytesReceived = result.bytesReceived;
      statsResult.audio.recv.bytesPersecond = (result.bytesReceived - statsResult.helper.audio.preBytesReceived) / (interval / 1000);
      statsResult.helper.audio.preBytesReceived = result.bytesReceived;
    }
  };

  statsPaser.outbounds = function (result) {
    if (result.type !== 'outbound-rtp') return;
    var streamType = result.id.split('_')[0];

    if (streamType === 'RTCOutboundRTPVideoStream') {
      statsResult.video.bytesSent = result.bytesSent;
      statsResult.video.send.codecId = result.codecId;
      statsResult.video.send.bytesPersecond = (result.bytesSent - statsResult.helper.video.preBytesSent) / (interval / 1000);
      statsResult.helper.video.preBytesSent = result.bytesSent;
    } else if (streamType === 'RTCOutboundRTPAudioStream') {
      statsResult.audio.bytesSent = result.bytesSent;
      statsResult.audio.send.bytesPersecond = (result.bytesSent - statsResult.helper.audio.preBytesSent) / (interval / 1000);
      statsResult.helper.audio.preBytesSent = result.bytesSent;
    }
  };

  statsPaser.transport = function (result) {
    if (result.type !== 'codec') return;

    if (statsResult.video.send.codecId === result.id) {
      statsResult.video.send.codec = result.mimeType;
    } else if (statsResult.video.recv.codecId === result.id) {
      statsResult.video.recv.codec = result.mimeType;
    }
  };

  runStatsLooper();
};

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }