(function() {
  var Cache, _base, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if ((_ref = window.Util) == null) {
    window.Util = {};
  }

  if ((_ref1 = (_base = window.Util).LRUCache) == null) {
    _base.LRUCache = {};
  }

  Cache = (function() {
    var _defaultProperties, _keys, _values;

    _values = {};

    _keys = [];

    _defaultProperties = {
      onInsert: function(keys, key) {
        var removed;
        keys.push(key);
        if (keys.length > this.capacity) {
          removed = keys.splice(keys.length - 1, 1);
        }
        return [keys, removed];
      },
      onGet: function(_keys, key) {
        return _keys;
      },
      supplier: function(key) {
        return null;
      }
    };

    /*
    		@param capacity is the size of the cache
    		@param onInsert is called with parameters (currentKeys, key) -> [newKeys, removedKeys] and must return the new key set
    		@param onGet is called with the currently requested key and the current keys
    		@param supplier function with signature: (key) -> value to add to the cache
    */


    function Cache(capacity, properties) {
      var _ref2, _ref3, _ref4;
      this.capacity = capacity;
      if (properties != null) {
        this.onInsert = properties.onInsert;
        this.onGet = properties.onGet;
        this.supplier = properties.supplier;
      }
      if ((_ref2 = this.onInsert) == null) {
        this.onInsert = _defaultProperties.onInsert;
      }
      if ((_ref3 = this.onGet) == null) {
        this.onGet = _defaultProperties.onGet;
      }
      if ((_ref4 = this.supplier) == null) {
        this.supplier = _defaultProperties.supplier;
      }
    }

    Cache.prototype._insert = function(key, value) {
      var removedKeys, rkey, _i, _len, _ref2;
      _ref2 = this.onInsert(_keys, key), _keys = _ref2[0], removedKeys = _ref2[1];
      if (_.isArray(removedKeys)) {
        for (_i = 0, _len = removedKeys.length; _i < _len; _i++) {
          rkey = removedKeys[_i];
          delete _values[rkey];
        }
      } else {
        delete _values[key];
      }
      return _values[key] = value;
    };

    Cache.prototype.get = function(key) {
      var out;
      this.onGet(_keys, key);
      out = _values[key];
      if (out == null) {
        out = typeof this.supplier === "function" ? this.supplier(key) : void 0;
        if (out != null) {
          this._insert(key, out);
        }
      }
      return out;
    };

    Cache.prototype.contains = function(key) {
      return _values[key] != null;
    };

    return Cache;

  })();

  window.Util.LRUCache = (function(_super) {
    var _onGet, _onInsert;

    __extends(LRUCache, _super);

    _onInsert = function(that, keys, key) {
      var ind, removed;
      ind = keys.lastIndexOf(key);
      if (ind !== keys.length - 1) {
        if (ind > -1) {
          keys.splice(ind, 1);
        }
        keys.push(key);
      }
      if (keys.length > this.capacity) {
        removed = keys.splice(0, 1);
      }
      return [keys, removed];
    };

    _onGet = function(that, keys, key) {
      var ind;
      ind = keys.lastIndexOf(key);
      if (ind !== keys.length - 1) {
        if (ind > -1) {
          keys.splice(ind, 1);
        }
        keys.push(key);
      }
      return null;
    };

    function LRUCache(capacity, supplier) {
      LRUCache.__super__.constructor.call(this, capacity, {
        onInsert: function(keys, key) {
          return _onInsert(this, keys, key);
        },
        onGet: function(keys, key) {
          return _onGet(this, keys, key);
        },
        supplier: supplier
      });
    }

    return LRUCache;

  })(Cache);

}).call(this);
