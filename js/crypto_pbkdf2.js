
/**
 * @fileOverview This is a PBKDF2 implementation that is based on SJCL, but modified to work with Node.js buffers and the native Node.js crypto library.
 * It's faster then SJCL, because it uses the native crypto library.
 * But it's not as fast as the native PBKDF2 function.
 * But it does support SHA-256 and SHA-512 (where as the native one only supports SHA-1)
*/


(function() {
  var Crypto, Hmac, SALT_SUFFIX;

  Crypto = require('crypto');

  SALT_SUFFIX = "00000001";

  /**
   * @class Hmac
  */


  Hmac = (function() {
    /**
     * @constructor
     * @param {buffer} key The key to derive data from.
     * @param {number} size The SHA algorithm to use.
    */

    function Hmac(key, size) {
      this.key = new Buffer(key);
      this.mode = "sha" + size;
    }

    /**
     * Hash data
     * @param {buffer} buffer The data to hash.
     * @return {buffer} The hashed data.
    */


    Hmac.prototype.encrypt = function(buffer) {
      var binary;
      binary = Crypto.createHmac(this.mode, this.key).update(buffer).digest('binary');
      return new Buffer(binary, 'binary');
    };

    return Hmac;

  })();

  /**
   * PBKDF2
   * @param {string|buffer} password The password to derive a key from.
   * @param {string|buffer} salt The salt.
   * @param {number} [count=10000] Number of iterations.
   * @param {number} [length=512] The SHA algorithm to use.
   * @return {buffer} The derived key.
  */


  module.exports = function(password, salt, count, length) {
    var bit_length, hmac, i, j, last, xorsum;
    if (count == null) {
      count = 10000;
    }
    if (length == null) {
      length = 512;
    }
    if (typeof password === 'string') {
      password = new Buffer(password);
    }
    if (typeof salt === 'string') {
      salt = new Buffer(salt + SALT_SUFFIX, 'hex');
    } else {
      salt = Buffer.concat([salt, new Buffer(SALT_SUFFIX, 'hex')]);
    }
    hmac = new Hmac(password, length);
    last = xorsum = hmac.encrypt(salt);
    bit_length = length / 8;
    i = 1;
    while (i < count) {
      xorsum = hmac.encrypt(xorsum);
      j = 0;
      while (j < bit_length) {
        last[j] ^= xorsum[j];
        j++;
      }
      i++;
    }
    return last.toString('hex');
  };

}).call(this);