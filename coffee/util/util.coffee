window.$ ?= jQuery

window._ ?= underscore

window.Util ?= 
	
	daysOfTheWeek : ["Mon", "Tue", "Wed", "Thu", "Fri"]

	forAllTimes : ( ->

		(eachTime, hourMin = null) ->

			for hour in [8..22] 
				hourStr = if hour >= 10 then "" + hour else "0" + hour
				for min in [0..59] by 30
					minStr = if min >= 10 then "" + min else "0" + min

					hourMin?(hourStr, minStr)

					for day in Util.daysOfTheWeek
						eachTime(hourStr, minStr, day)

		)()

	scheduleCellId : (term, day, hour, min) ->
		hourStr = if hour < 10 then "0" + hour else hour 
		minStr = if min < 10 then "0" + min else min

		"t#{Number(term)}_t#{hourStr}#{minStr}_#{day}"

## Simple time construct for doing basics
class Util.SimpleTime

	constructor: (hours, minutes, isAM) ->
		if isAM? 
			if hours == 12
				hours = 0

			hours = hours + (if isAM then 0 else 12)


		@minute = minutes % 60
		extraHours = Math.floor(minutes / 60)

		@hour = (hours + extraHours) % 24

	addHours: (hours) ->
		new Util.SimpleTime(@hour + hours, @minute)

	addMinutes: (minutes) ->
		newMins = @minute + minutes
		hoursToAdd = Math.floor(newMins / 60)

		if newMins < 0
			newMins += 60
			hoursToAdd -= 1
		
		mins = newMins % 60
		new Util.SimpleTime(@hour + hoursToAdd, mins)

	add: (other) ->
		t = this.addMinutes(other.minute)
		t.addHours(other.hour)

	## Difference between two times, this is really poorly written
	dif: (other) ->
		new Util.SimpleTime(@hour - other.hour, @minute - other.minute)
	
	cmp: (other) ->
		if !other?
			1

		out = @hour - other.hour
		if out == 0
			out = @minute - other.minute

		out

	## true if `this` > `other`
	gt: (other) ->
		this.cmp(other) > 0

	lt: (other) ->
		this.cmp(other) < 0

	lte: (other) -> 
		this.cmp(other) <= 0
    

	iterateTo: (other, onStep, step) ->
    	step ?= new Util.SimpleTime(0, 30)
    	curr = this.copy()

    	out = []
    	while curr.lt(other)
    		out.push onStep?(curr) 
    		curr = curr.add(step)

    	out

	copy: -> new Util.SimpleTime(@hour, @minute)


