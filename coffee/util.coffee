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
