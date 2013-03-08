(function() {
  var Crypto, Item, Note, Opdata,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Crypto = require('./crypto');

  Opdata = require('./opdata');

  /**
   * @class An item stores data such as usernames and passwords.
  */


  Item = (function() {
    /**
     * Create a new Item.
     * @param {Kecyhain} keychain The keychain to encrypt the item with.
     * @param {Object} data The data to add to the Item.
     * @return {Item} The item.
    */

    Item.create = function(keychain, data) {
      var item, keys, timeNow;
      timeNow = Math.floor(Date.now() / 1000);
      item = new Item(keychain, {
        uuid: Crypto.generateUuid(),
        created: timeNow,
        updated: timeNow,
        category: '001'
      });
      item.overview = {
        title: data.title,
        ainfo: data.username,
        url: data.url,
        URLS: [
          {
            l: 'website',
            u: data.url
          }
        ]
      };
      item.details = {
        fields: [
          {
            type: 'T',
            name: 'username',
            value: data.username,
            designation: 'username'
          }, {
            type: 'P',
            name: 'password',
            value: data.password,
            designation: 'password'
          }
        ],
        notesPlain: data.notes || ''
      };
      keys = {
        encryption: Crypto.randomBytes(32),
        hmac: Crypto.randomBytes(32)
      };
      item.setItemKeys(keys);
      /**
       *
       * TODO: Move into seperate encryption functions
       *
      
        keys.both = Crypto.concat([encryptionKey, hmacKey])
      
        detailsBuffer = Crypto.toBuffer(JSON.stringify(item.details), 'utf8')
        overviewBuffer = Crypto.toBuffer(JSON.stringify(item.overview), 'utf8')
      
        masterKey = new Opdata(master.encryption, master.hmac)
        overviewKey = new Opdata(overview.encryption, overview.hmac)
        itemKey = new Opdata(encryptionKey, hmacKey)
      
        item.k = masterKey.encrypt('itemKey', encryptionAndHmacKey)
        item.d = itemKey.encrypt('item', detailsBuffer)
        item.o = overviewKey.encrypt('item', overviewBuffer)
      */

      return item;
    };

    /**
     * Create a new Item instance.
     * @constructor
     * @param {Object} [attrs] Any attributes to load into the item
    */


    function Item(keychain, attrs) {
      var attr, key;
      this.keychain = keychain;
      this.match = __bind(this.match, this);
      this.keysUnlocked = false;
      this.detailsUnlocked = false;
      this.overviewUnlocked = false;
      this.encrypted = {};
      if (attrs != null) {
        for (key in attrs) {
          attr = attrs[key];
          this[key] = attr;
        }
      }
    }

    /**
     * Load attributes from the exported format
     * @param {Object} data Data to load
     * @return {this}
    */


    Item.prototype.load = function(data) {
      var key, _i, _j, _len, _len1, _ref, _ref1;
      _ref = ['category', 'created', 'folder', 'tx', 'updated', 'uuid'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        if (data[key] != null) {
          this[key] = data[key];
        }
      }
      _ref1 = ['d', 'hmac', 'k', 'o'];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        key = _ref1[_j];
        if (data[key] == null) {
          continue;
        }
        this[key] = Crypto.fromBase64(data[key]);
      }
      return this;
    };

    /**
     * Set the item encryption keys
     * @param {Opdata} master The keychain master keys.
     * @param {Object} keys The encryption and hmac keys.
     * @example
     *   item.setItemKeys(master, {
     *     encryption: encryptionKey,
     *     hmac: hmacKey
     *   })
    */


    Item.prototype.setItemKeys = function(keys) {
      var joined;
      joined = Buffer.concat([keys.encryption, keys.hmac]);
      return this.keys = this.kecyhain.master.encrypt('itemKey', joined);
    };

    /**
     * Lock the item completely
    */


    Item.prototype.lock = function() {
      this.lockKeys();
      this.lockDetails();
      return this.lockOverview();
    };

    /**
     * Decrypt the item encryption keys.
     * @param {Opdata} master The keychain master keys.
     * @return {Opdata} The item encryption keys.
    */


    Item.prototype.unlockKeys = function() {
      var keys;
      keys = this.keychain.master.decrypt('itemKey', this.keys);
      this.keys = new Opdata(keys[0], keys[1]);
      this.keysUnlocked = true;
      return this.keys;
    };

    /**
     * Decrypt the overview data of an item.
     * @param {Opdata} overviewKey An Opdata profile key made with the
     *                             keychain's overview keys. Used to decrypt
     *                             the overview data.
     * @return {Object} The overview data.
    */


    Item.prototype.unlockOverview = function() {
      var json;
      json = this.keychain.overview.decrypt('item', this.encrypted.overview);
      this.overview = JSON.parse(json);
      this.overviewUnlocked = true;
      return this.overview;
    };

    Item.prototype.lockOverview = function() {
      var buffer, json;
      json = JSON.stringify(this.overview);
      buffer = Crypto.toBuffer(json, 'utf8');
      this.encrypted.overview = this.keychain.overview.encrypt('item', buffer);
      this.overviewUnlocked = false;
      return this.encrypted.overview;
    };

    /**
     * Decrypt the item details.
     * @param {Object} master The keychain's master keys. Used to decrypt the encryption keys.
     * @return {Object} The item details.
    */


    Item.prototype.unlockDetails = function() {
      var json;
      if (!this.keysUnlocked) {
        this.decryptItemKeys();
      }
      json = this.keys.decrypt('item', this.encrypted.details);
      this.details = JSON.parse(json);
      this.detailsUnlocked = true;
      return this.details;
    };

    Item.prototype.lockDetails = function() {
      var buffer, json;
      if (!this.keysUnlocked) {
        this.decryptItemKeys();
      }
      json = JSON.stringify(this.details);
      buffer = Crypto.toBuffer(json, 'utf8');
      this.encrypted.details = this.keys.encrypt('item', buffer);
      this.detailsUnlocked = false;
      return this.encrypted.details;
    };

    /**
     * Calculate the hmac of the item
     * TODO: Find out why it doesn't work...
     * @param {Buffer} key The master hmac key
     * @return {String} The hmac of the item encoded in hex
    */


    Item.prototype.calculateHmac = function(key) {
      var data, dataToHmac, element, hmac, _ref;
      dataToHmac = "";
      _ref = this.toJSON();
      for (element in _ref) {
        data = _ref[element];
        if (element === "hmac") {
          continue;
        }
        dataToHmac += element + data;
      }
      dataToHmac = new Buffer(dataToHmac, 'utf8');
      hmac = Crypto.hmac(dataToHmac, key, 256);
      console.log(hmac);
      return console.log(this.hmac.toString('hex'));
    };

    /**
     * Turn an item into a JSON object.
     * @return {Object} The JSON object.
    */


    Item.prototype.toJSON = function() {
      var _ref, _ref1, _ref2, _ref3;
      return {
        category: this.category,
        created: this.created,
        d: (_ref = this.d) != null ? _ref.toString('base64') : void 0,
        hmac: (_ref1 = this.hmac) != null ? _ref1.toString('base64') : void 0,
        k: (_ref2 = this.keys) != null ? _ref2.toString('base64') : void 0,
        o: (_ref3 = this.o) != null ? _ref3.toString('base64') : void 0,
        tx: this.tx,
        updated: this.updated,
        uuid: this.uuid
      };
    };

    /**
     * Check to see if an item matches a query. Used for filtering items.
     * @param {String} query The search query.
     * @return {Boolean} Whether or not the item matches the query.
    */


    Item.prototype.match = function(query) {
      query = query.toLowerCase();
      return this.overview.title.toLowerCase().match(query);
    };

    return Item;

  }).call(this);

  Note = (function(_super) {

    __extends(Note, _super);

    function Note() {
      Note.__super__.constructor.apply(this, arguments);
    }

    Note.prototype.category = "003";

    Note.prototype.set = function(data) {
      this.details.notesPlain = data;
      return this.overview.notesPlain = data.slice(0, 80);
    };

    return Note;

  })(Item);

  module.exports = Item;

}).call(this);
