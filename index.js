var Steez = require("steez"),
    util = require("util");

var STATE = {
  INITIAL: 1,
  CSI: 2,
  SEQUENCE: 3,
};

var Yttej = module.exports = function Yttej() {
  Steez.call(this);

  this.state = STATE.INITIAL;
  this.buffer = null;
};
util.inherits(Yttej, Steez);

Yttej.prototype.write = function write(data) {
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data);
  }

  var offset = 0;
  while (offset < data.length) {
    if (this.state === STATE.INITIAL) {
      var len = 0;
      while (offset + len < data.length) {
        if (data[offset + len] === 0x1b) {
          break;
        }

        len++;
      }

      if (len === data.length) {
        this.emit("data", data);
      } else if (len > 0) {
        this.emit("data", data.slice(offset, offset + len));
      }

      offset += len;
      if (offset >= data.length) {
        break;
      }
    }

    if (this.state === STATE.INITIAL && data[offset] === 0x1b) {
      this.state = STATE.CSI;

      offset++;
      if (offset >= data.length) {
        break;
      }
    }

    if (this.state === STATE.CSI) {
      if (data[offset] !== 0x5b) {
        this.emit("data", new Buffer([0x1b]));

        this.state = STATE.INITIAL;

        continue;
      }

      this.state = STATE.SEQUENCE;
      this.buffer = new Buffer(0);

      offset++;
      if (offset >= data.length) {
        break;
      }
    }

    if (this.state === STATE.SEQUENCE) {
      var len = 0;
      while (offset + len < data.length) {
        if (data[offset + len] >= 64 && data[offset + len] <= 126) {
          break;
        }

        len++;
      }

      if (offset + len === data.length) {
        var tmp = new Buffer(this.buffer.length + data.length);
        this.buffer.copy(tmp);
        data.copy(tmp, this.buffer.length);
        this.buffer = tmp;
      } else if (len > 0) {
        var tmp = new Buffer(this.buffer.length + len);
        this.buffer.copy(tmp);
        data.copy(tmp, this.buffer.length, offset, offset, offset + len);
        this.buffer = tmp;
      }

      offset += len;
      if (offset >= data.length) {
        break;
      }

      this.emit("sequence", {char: String.fromCharCode(data[offset]), data: this.buffer});
      this.buffer = null;
      this.state = STATE.INITIAL;

      offset++;
      if (offset >= data.length) {
        break;
      }
    }
  }

  return this.writable && !this.paused;
};
