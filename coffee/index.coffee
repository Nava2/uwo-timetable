window.$ ?= jQuery

window._ ?= lodash

substringMatcher = (depts) ->
	(q, cb) ->
		# an array that will be populated with substring matches
		matches = [];

		# regex used to determine if a string contains the substring `q`
		substrRegex = new RegExp(q, 'i');

		# iterate through the pool of strings and for any string that
		# contains the substring `q`, add it to the `matches` array
		for d, i in depts
			if substrRegex.test(d.total)
				# the typeahead jQuery plugin expects suggestions to a
				# JavaScript object, refer to typeahead docs for more info
				matches.push d

		cb matches

cellColours = [
		{ 
			back: 'rgb(0, 191, 127)'
			border: 'rgb(0, 127, 85)'
		},
		{
			back: 'rgb(191, 181, 0)' 
			border: 'rgb(127, 121, 0)'
		},
		{
			back: 'rgb(191, 126, 0)' 
			border: 'rgb(127, 84, 0)'
		},
		{
			back: 'rgb(191, 67, 51)' 
			border: 'rgb(127, 45, 34)'
		},
		{
			back: 'rgb(191, 34, 163)' 
			border: 'rgb(127, 23, 108)'
		},
		{
			back: 'rgb(191, 126, 0)', 
			border: 'rgb(127, 84, 0)'
		},
		{
			back: 'rgb(111, 37, 191)', 
			border: 'rgb(74, 25, 127)'
		},
		{
			back: 'rgb(35, 83, 191)', 
			border: 'rgb(23, 55, 127)'
		}

	]

class Schedule

	constructor: ->

		@_timetable = {}
		ttable = @_timetable
		Util.forAllTimes(
				(hour, min, day) ->
					ttable[day] ?= {}
					ttable["#{hour}#{min}"] = {busy : false}
			)

	addClass: (component) ->
		cellColour = cellColours[Math.floor(Math.random()*cellColours.length)]
			
		for time in component.times 

			console.log "working with:", time

			rows = time.iterate().length

			if rows == 0
				throw new Exception("rows == 0")

			start = time.startTime

			id = Util.scheduleCellId(time.class.term, time.day, start.hour, start.minute)

			console.log "Setting id=#{id} w/ span: #{rows}"

			cell = $("##{id}")
			cell.attr('rowspan', rows)
			cell.addClass('class')
			cell.css(
				'border-color' 		: cellColour.border
				'background-color'	: cellColour.back
				)

			div = $(cell).$div()
			
			div.$h5("#{component.class.courseCode}")
			div.$p("#{component.type} #{component.section}")


		undefined

## global schedule
schedule = new Schedule

loadClassSelector = ->
	# get the deparment data
	departments = []
	TimetableCreator.fetchDepartments((data) ->
		for d in data
			departments.push d
		)

	( ->
		selected =
			class 	: ->
				courseCode = $("#classSelect option:selected")?.val()
				if courseCode?
					courseCache.get courseCode
				else
					null

			lecture : ->
				lectureSection = $("#lectureSelect option:selected")?.val()
				if lectureSection?
					_.findWhere(this.class().getLectures(), {section: lectureSection})
				else
					null

			extra 	: ->
				extraSection = $("#extraSelect option:selected")?.val()
				if extraSection?
					_.findWhere(this.class().getExtras(), {section: extraSection})
				else
					null

		courseCache = new LRUCache 5

		$("#classDept").typeahead({
				hint 		: true
				highlight	: true
				minLength	: 2
			}, {
				name: "departments"
				displayKey: "total"
				source: substringMatcher(departments)
			}).bind('typeahead:selected', (obj, selected, name) ->
				## selected => "this" object
				if (!selected?)
					console.error "selected invalid dept: #{selected}, #{name}"

				select = $("#classSelect")
				select.find('option')
				    .remove()
				    .end() # clear all the options
				select.prop('disabled', true)

				currentClasses = courseCache.get selected.value 

				if !currentClasses?
					TimetableCreator.fetchClasses(selected.value, (classes) ->
						select.prop('disabled', false)

						currentClasses = classes
					)

					courseCache.insert selected.value, currentClasses

					for clazz in currentClasses
						$(select).$option(clazz.fullTitle, {value : clazz.courseCode})

				
			)

		$("#classSelect").change (event) ->
			clazz = selected.class()

			lectures = $("#lectureSelect")
			extras = $("#extraSelect")

			for sel in [lectures, extras]
				sel.find('option')
					.remove()
				sel.prop('disabled', true)

			for own section, obj of _.indexBy(clazz.getLectures(), 'section')
				$(lectures).$option("LEC #{section}", {value : section})

			if clazz.hasExtras()
				for ext in clazz.getExtras()
					$(extras).$option("#{ext.type} #{ext.section}", {value: ext.section})

				extras.prop('disabled', false)

			lectures.prop('disabled', false)

		$("#lectureSelect").change (event) ->
			schedule.addClass selected.lecture()

		$("#extraSelect").change (event) ->
			schedule.addClass selected.extra()



	)()



loadTables = ->
	headers = ["", "Mon", "Tue", "Wed", "Thu", "Fri"]

	## build the tables
	for container,i in $("#term_container div")
		table = $(container).$table({class : "table"})

		termStr = "t#{i}"

		# build the header row
		headRow = table.$thead().$tr()
		for header in headers
			headRow.$th(header, {})

		body = table.$tbody()

		Util.forAllTimes(
				(hour, min, day) ->
					$("##{termStr}_t#{hour}#{min}").$td({
						id: "#{termStr}_t#{hour}#{min}_#{day}"
					})
					

				, (hour, min) ->
					# write the rows of the table:
					tr = body.$tr({id: "#{termStr}_t#{hour}#{min}"})
					tr.$th("#{hour}:#{min}", {
						id: "#{termStr}_t#{hour}#{min}"
					})
			)


jQuery ->
	loadTables()

	loadClassSelector()


