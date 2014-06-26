window.$ ?= jQuery

window._ ?= underscore

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
		for time in component.times

			console.log "working with:", time

			rows = time.iterate().length

			if rows == 0
				throw new Exception("rows == 0")

			start = time.startTime

			id = Util.scheduleCellId(time.class.term, time.day, start.hour, start.minute)

			console.log "Setting id=#{id} w/ span: #{rows}"

			cell = $("##{id}")
			cell.attr('rowspan', rows).css({'background-color': 'red', 'font-size': '10px'})
			cell.addClass('class')
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
		currentClasses = null

		selected =
			class 	: ->
				courseCode = $("#classSelect option:selected")?.val()
				if courseCode?
					_.findWhere(currentClasses, {courseCode: courseCode})
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

				TimetableCreator.fetchClasses(selected.value, (classes) ->
					## have all the current classes
					for clazz in classes
						$(select).$option(clazz.fullTitle, {value : clazz.courseCode})

					select.prop('disabled', false)

					currentClasses = classes
				)
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


