
window.LRUCache ?= {}

( (w) ->	
	class Cache

		_values = {}
		_keys = []

		###
			@param capacity is the size of the cache
			@param onInsert is called with parameters (currentKeys, key) and must return the new key set
			@param onGet is called with the currently requested key and the current keys
		###
		constructor: (@capacity, @onInsert, @onGet) -> 
			if !@onGet?
				@onGet = @onInsert

		insert: (key, value) ->
			_keys = @onInsert(_keys, key)
			_values[key] = value

			# clean up the cache
			if _keys.length > @capacity
				len = _keys.length - 1
				key = _keys[len]
				_keys.splice(len, 1)
				delete _values[key]


		get: (key) ->
	    	@onGet(_keys, key)

	    	_values[key]


		contains: (key) ->
	    	_values[key]?

	class w.LRUCache extends Cache

		_onInsert = (keys, key) -> 
			ind = keys.lastIndexOf key
			if (ind > -1 and ind != keys.length - 1)
				keys.splice(ind, 1)

			if (ind != keys.length - 1)
				keys.push key
			
			keys

		_onGet = (keys, key) -> 
			ind = keys.lastIndexOf key
			if (ind > -1 and ind != keys.length - 1)
				keys.splice(ind, 1)

				if (ind != keys.length - 1)
					keys.push key
			
			undefined

		constructor: (capacity) ->

			

			super capacity, _onInsert, _onGet
)(window)
