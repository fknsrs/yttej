var stream = require("stream"),
    util = require("util");

var STATE = {
  INITIAL: 1,
  CSI: 2,
  SEQUENCE: 3,
};

var Yttej = module.exports = function Yttej(options) {
  options = options || {};
  options.objectMode = true;
  options.highWaterMark = options.highWaterMark || 1;

  stream.Transform.call(this, options);

  this.state = STATE.INITIAL;
  this.buffer = null;
};
util.inherits(Yttej, stream.Transform);

Yttej.prototype._transform = function _transform(input, encoding, done) {
  if (!Buffer.isBuffer(input)) {
    input = Buffer(input, encoding);
  }

  var offset = 0;
  while (offset < input.length) {
    if (this.state === STATE.INITIAL) {
      var len = 0;
      while (offset + len < input.length) {
        if (input[offset + len] === 0x1b) {
          break;
        }

        len++;
      }

      if (len === input.length) {
        this.push({type: "data", data: input});
      } else if (len > 0) {
        this.push({type: "data", data: input.slice(offset, offset + len)});
      }

      offset += len;
      if (offset >= input.length) {
        break;
      }
    }

    if (this.state === STATE.INITIAL && input[offset] === 0x1b) {
      this.state = STATE.CSI;

      offset++;
      if (offset >= input.length) {
        break;
      }
    }

    if (this.state === STATE.CSI) {
      if (input[offset] !== 0x5b) {
        this.push({type: "data", data: new Buffer([0x1b])});

        this.state = STATE.INITIAL;

        continue;
      }

      this.state = STATE.SEQUENCE;
      this.buffer = new Buffer(0);

      offset++;
      if (offset >= input.length) {
        break;
      }
    }

    if (this.state === STATE.SEQUENCE) {
      var len = 0;
      while (offset + len < input.length) {
        if (input[offset + len] >= 64 && input[offset + len] <= 126) {
          break;
        }

        len++;
      }

      this.buffer = Buffer.concat([this.buffer, input.slice(offset, offset + len)]);

      offset += len;
      if (offset >= input.length) {
        break;
      }

      this.push({type: "sequence", char: String.fromCharCode(input[offset]), input: this.buffer});
      this.buffer = null;
      this.state = STATE.INITIAL;

      offset++;
      if (offset >= input.length) {
        break;
      }
    }
  }

  return done();
};
