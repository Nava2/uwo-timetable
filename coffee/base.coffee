window.TimetableCreator ?= {}

window.$ ?= jQuery

window._ ?= lodash

class TimetableCreator.TimetableQuery 

	constructor: (@subject) ->

class TimetableCreator.ClassInstance

	_titleReg = /([A-Z]+\s+[0-4]\d{3}([ABFGYZ]?))\s+-\s+(.*)/

	constructor: (@fullTitle, table) ->
			
		chunks = @fullTitle.match(_titleReg)
		@courseCode = chunks[1]
		@term = if chunks[2] in "AFY" then 0 else 1
		@title = chunks[3]

		#helper function
		decodeDays = (tableRow) ->
				(Util.daysOfTheWeek[i] for td, i in tableRow.td when td.p.trim() isnt "") 

		safeGetP = (td) -> 
			if (td?) then td.p else ""

		raws = []
		for comp in table.tr 
			td = comp.td
			dayz = decodeDays td[3].table.tr

			if dayz.length > 0
				raws.push { 
					section 	: td[0].p
					type 		: td[1].p
					classNbr 	: td[2].p
					days 		: dayz
					startTime 	: safeGetP td[4]
					endTime 	: safeGetP td[5]
					location 	: safeGetP td[6]
					instructor  : safeGetP td[7]
					isFull 		: td[9].p is "Full"
				} 

		@_lectComps = []
		@_extras = []
		@compByClassNbr = {}
		for raw in raws 
			@compByClassNbr[raw.classNbr] ?= new TC.ClassInstance.Component(this, raw.section, raw.type, raw.classNbr,
				[], raw.isFull)

			tcomp = @compByClassNbr[raw.classNbr]

			switch tcomp.type 
				when TC.SectionType.Lab, TC.SectionType.Tut then @_extras.push tcomp
				when TC.SectionType.Lecture then @_lectComps.push tcomp

			for day in raw.days
				tcomp.times.push new TC.ClassInstance.Time(this, day, raw.startTime, raw.endTime)

		@comps = (comp for own key, comp of @compByClassNbr)

	getExtras:  ->
		@_extras

	hasExtras: ->
		@_extras.length isnt 0

	getLectures: ->
		@_lectComps



# Component of a class, is it a lecture, lab, and the times associated
class TimetableCreator.ClassInstance.Component

	constructor: (@class, @section, @type, @classNbr, @times, @isFull) ->

# Holds information about repeating classes
class TimetableCreator.ClassInstance.Time

	
	# create a new instance
	constructor: (@class, @day, startTime, endTime) ->
		newDate = ( ->
				_dateReg = /(\d{1,2}):(\d{2})\s+([AP]M)/
				(str) -> 
					groups = _dateReg.exec str
					new Util.SimpleTime parseInt(groups[1]), parseInt(groups[2]), groups[3] is "AM"
			)()

		@startTime = newDate startTime
		@endTime = newDate endTime

	iterate : (onIter) ->
		@startTime.iterateTo(@endTime, onIter, new Util.SimpleTime(0, 30))

# Sections
TimetableCreator.SectionType = 
	Lecture : "LEC"
	Lab 	: "LAB"
	Tut 	: "TUT"
	Exam	: "EXM"

TC = TimetableCreator

# Private: encodes a URL for usage with getJSON and yahoo's YQL
encodeYql = (yql) -> 
	encodeURI(yql)
	    .replace(/%27/g, "\'")
	    .replace(/%0A/g, '')
	    .replace(/\//g, '%2f')
	    .replace(/&/g, '%26')
	    .replace(/\?/g, '%3f')
		.replace(/\=/g, '%3D')
		.replace(/:/g, '%3A')
		.replace(/@/g, '%40')
		.replace(/,/g, '%2C')
		.replace(/\n/g, '')
		.replace(/\s{2,}/g, ' ')
		.replace(/\s/g, '%20')


TimetableCreator.fetchClasses = (subject, withData) ->
	yql = """select * from html 
				where url="http://studentservices.uwo.ca/secure/timetables/mastertt/ttindex.cfm?subject=#{subject}&Designation=Any&catalognbr=&CourseTime=All&Component=All&time=&end_time=&day=m&day=tu&day=w&day=th&day=f&Campus=Any&command=search" 
					and xpath="//div[@class='span12']"
		  """ 
	encodedYql = encodeYql(yql)

	fullquery = "https://query.yahooapis.com/v1/public/yql?q=" + encodedYql + "&format=json&callback="

	$.ajax(fullquery, 
		dataType: "json"
		async: false
		).done( (data) ->
			div = data.query.results.div
			## Build up the results using the ClassInstance 
			withData (new TC.ClassInstance(t[0], t[1].tbody) for t in _.zip(div.h4, div.table))
		)

TimetableCreator.fetchDepartments = ( ->
	yql = """https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Fstudentservices.uwo.ca%2Fsecure%2Ftimetables%2Fmastertt%2Fttindex.cfm%22%20and%20xpath%3D%22%2F%2Fselect%5B%40id%3D'inputSubject'%5D%2Foption%5B%40value%20!%3D%20''%5D%22&format=json&callback="""

	(withData) ->
		$.getJSON(yql, (data) -> 
				console.log "dept count = " + data.query.count 

				## Build up the results using the ClassInstance 
				
			).done( (data) ->
				withData ({title: opt.content, value: opt.value, total : "#{opt.value} - #{opt.content}"} for opt in data.query.results.option)
			)			
	)()
	