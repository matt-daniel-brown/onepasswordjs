'use strict';

// Dependencies
var crypto = require('./crypto');

// Constants
var LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var SYMBOLS = '!<>[]{}()=+-_!@#$%^&*.,?/;:\'\"\\';
var DIGITS = '0123456789';

var random = function(chars, n) {
  var char, i, index, len, string, _i;
  if (n < 0) {
    return '';
  }
  len = chars.length;
  string = '';
  for (i = _i = 0; _i < n; i = _i += 1) {
    index = Math.floor(crypto.randomValue() * len);
    char = chars[index];
    string += char;
  }
  return string;
};

var merge = function(a, b) {
  var i, len, pos, _i, _ref;
  len = a.length + 1;
  for (i = _i = 0, _ref = b.length; _i < _ref; i = _i += 1) {
    pos = Math.floor(crypto.randomValue() * len);
    a = a.slice(0, pos) + b[i] + a.slice(pos);
    len += 1;
  }
  return a;
};

module.exports = {
  random: function(length, digits, symbols) {
    var len, password;
    if (length == null) {
      length = 20;
    }
    if (digits == null) {
      digits = 0;
    }
    if (symbols == null) {
      symbols = 0;
    }
    len = {};
    len.letters = length - digits - symbols;
    if (len.letters < 0) {
      len.letters = 0;
    }
    len.digits = (digits > length ? length : digits);
    len.symbols = length - len.digits - len.letters;
    if (len.symbols < 0) {
      len.symbols = 0;
    }
    password = random(LETTERS, len.letters);
    if (len.digits > 0) {
      digits = random(DIGITS, len.digits);
      password = merge(password, digits);
    }
    if (len.symbols > 0) {
      symbols = random(SYMBOLS, len.symbols);
      password = merge(password, symbols);
    }
    return password;
  }
};
