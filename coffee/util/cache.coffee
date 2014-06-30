
window.Util ?= {}
window.Util.LRUCache ?= {}
	
class Cache

	_values = {}
	_keys = []

	_defaultProperties = 
		onInsert : (keys, key) -> 
			keys.push key
			if (keys.length > @capacity)
				removed = keys.splice(keys.length - 1, 1)

			[keys, removed]

		onGet : (_keys, key) ->
			_keys

		supplier : (key) -> null

	###
		@param capacity is the size of the cache
		@param onInsert is called with parameters (currentKeys, key) -> [newKeys, removedKeys] and must return the new key set
		@param onGet is called with the currently requested key and the current keys
		@param supplier function with signature: (key) -> value to add to the cache
	###
	constructor: (@capacity, properties) ->

		if properties?
			@onInsert = properties.onInsert
			@onGet = properties.onGet
			@supplier = properties.supplier

		@onInsert ?= _defaultProperties.onInsert
		@onGet ?= _defaultProperties.onGet
		@supplier ?= _defaultProperties.supplier


	_insert : (key, value) ->
		[_keys, removedKeys] = @onInsert(_keys, key)
		
		# clean up the cache
		if _.isArray removedKeys
			for rkey in removedKeys
				delete _values[rkey]
		else 
			delete _values[key]

		_values[key] = value


	get: (key) ->
		@onGet(_keys, key)

		out = _values[key]
		if !out? 
			out = @supplier?(key)
			if out?
				@_insert(key, out) 

		out

	contains: (key) ->
		_values[key]?

class window.Util.LRUCache extends Cache

	_onInsert = (that, keys, key) -> 
		ind = keys.lastIndexOf key
		if ind != keys.length - 1
			if (ind > -1)
				keys.splice(ind, 1)

			keys.push key

		if keys.length > @capacity
			removed = keys.splice(0, 1)
		
		[keys, removed]

	_onGet = (that, keys, key) -> 
		ind = keys.lastIndexOf key
		if ind != keys.length - 1
			if ind > -1
				keys.splice(ind, 1)

			keys.push key
		
		null

	constructor: (capacity, supplier) ->
		super capacity, {
			onInsert: (keys, key) -> _onInsert(this, keys, key)
			onGet: (keys, key) -> _onGet(this, keys, key)
			supplier: supplier
		}
