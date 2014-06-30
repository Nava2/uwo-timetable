(function() {
  var TC, encodeYql, _ref, _ref1, _ref2,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty;

  if ((_ref = window.TimetableCreator) == null) {
    window.TimetableCreator = {};
  }

  if ((_ref1 = window.$) == null) {
    window.$ = jQuery;
  }

  if ((_ref2 = window._) == null) {
    window._ = lodash;
  }

  TimetableCreator.TimetableQuery = (function() {

    function TimetableQuery(subject) {
      this.subject = subject;
    }

    return TimetableQuery;

  })();

  TimetableCreator.ClassInstance = (function() {
    var _titleReg;

    _titleReg = /([A-Z]+\s+[0-4]\d{3}([ABFGYZ]?))\s+-\s+(.*)/;

    function ClassInstance(fullTitle, table) {
      var chunks, comp, day, dayz, decodeDays, key, raw, raws, safeGetP, tcomp, td, _base, _i, _j, _k, _len, _len1, _len2, _name, _ref3, _ref4, _ref5, _ref6;
      this.fullTitle = fullTitle;
      chunks = this.fullTitle.match(_titleReg);
      this.courseCode = chunks[1];
      this.term = (_ref3 = chunks[2], __indexOf.call("AFY", _ref3) >= 0) ? 0 : 1;
      this.title = chunks[3];
      decodeDays = function(tableRow) {
        var i, td, _i, _len, _ref4, _results;
        _ref4 = tableRow.td;
        _results = [];
        for (i = _i = 0, _len = _ref4.length; _i < _len; i = ++_i) {
          td = _ref4[i];
          if (td.p.trim() !== "") {
            _results.push(Util.daysOfTheWeek[i]);
          }
        }
        return _results;
      };
      safeGetP = function(td) {
        if ((td != null)) {
          return td.p;
        } else {
          return "";
        }
      };
      raws = [];
      _ref4 = table.tr;
      for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
        comp = _ref4[_i];
        td = comp.td;
        dayz = decodeDays(td[3].table.tr);
        if (dayz.length > 0) {
          raws.push({
            section: td[0].p,
            type: td[1].p,
            classNbr: td[2].p,
            days: dayz,
            startTime: safeGetP(td[4]),
            endTime: safeGetP(td[5]),
            location: safeGetP(td[6]),
            instructor: safeGetP(td[7]),
            isFull: td[9].p === "Full"
          });
        }
      }
      this._lectComps = [];
      this._extras = [];
      this.compByClassNbr = {};
      for (_j = 0, _len1 = raws.length; _j < _len1; _j++) {
        raw = raws[_j];
        if ((_ref5 = (_base = this.compByClassNbr)[_name = raw.classNbr]) == null) {
          _base[_name] = new TC.ClassInstance.Component(this, raw.section, raw.type, raw.classNbr, [], raw.isFull);
        }
        tcomp = this.compByClassNbr[raw.classNbr];
        switch (tcomp.type) {
          case TC.SectionType.Lab:
          case TC.SectionType.Tut:
            this._extras.push(tcomp);
            break;
          case TC.SectionType.Lecture:
            this._lectComps.push(tcomp);
        }
        _ref6 = raw.days;
        for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
          day = _ref6[_k];
          tcomp.times.push(new TC.ClassInstance.Time(this, day, raw.startTime, raw.endTime));
        }
      }
      this.comps = (function() {
        var _ref7, _results;
        _ref7 = this.compByClassNbr;
        _results = [];
        for (key in _ref7) {
          if (!__hasProp.call(_ref7, key)) continue;
          comp = _ref7[key];
          _results.push(comp);
        }
        return _results;
      }).call(this);
    }

    ClassInstance.prototype.getExtras = function() {
      return this._extras;
    };

    ClassInstance.prototype.hasExtras = function() {
      return this._extras.length !== 0;
    };

    ClassInstance.prototype.getLectures = function() {
      return this._lectComps;
    };

    return ClassInstance;

  })();

  TimetableCreator.ClassInstance.Component = (function() {

    function Component(_class, section, type, classNbr, times, isFull) {
      this["class"] = _class;
      this.section = section;
      this.type = type;
      this.classNbr = classNbr;
      this.times = times;
      this.isFull = isFull;
    }

    return Component;

  })();

  TimetableCreator.ClassInstance.Time = (function() {

    function Time(_class, day, startTime, endTime) {
      var newDate;
      this["class"] = _class;
      this.day = day;
      newDate = (function() {
        var _dateReg;
        _dateReg = /(\d{1,2}):(\d{2})\s+([AP]M)/;
        return function(str) {
          var groups;
          groups = _dateReg.exec(str);
          return new Util.SimpleTime(parseInt(groups[1]), parseInt(groups[2]), groups[3] === "AM");
        };
      })();
      this.startTime = newDate(startTime);
      this.endTime = newDate(endTime);
    }

    Time.prototype.iterate = function(onIter) {
      return this.startTime.iterateTo(this.endTime, onIter, new Util.SimpleTime(0, 30));
    };

    return Time;

  })();

  TimetableCreator.SectionType = {
    Lecture: "LEC",
    Lab: "LAB",
    Tut: "TUT",
    Exam: "EXM"
  };

  TC = TimetableCreator;

  encodeYql = function(yql) {
    return encodeURI(yql).replace(/%27/g, "\'").replace(/%0A/g, '').replace(/\//g, '%2f').replace(/&/g, '%26').replace(/\?/g, '%3f').replace(/\=/g, '%3D').replace(/:/g, '%3A').replace(/@/g, '%40').replace(/,/g, '%2C').replace(/\n/g, '').replace(/\s{2,}/g, ' ').replace(/\s/g, '%20');
  };

  TimetableCreator.fetchClasses = function(subject, withData) {
    var encodedYql, fullquery, yql;
    yql = "select * from html \nwhere url=\"http://studentservices.uwo.ca/secure/timetables/mastertt/ttindex.cfm?subject=" + subject + "&Designation=Any&catalognbr=&CourseTime=All&Component=All&time=&end_time=&day=m&day=tu&day=w&day=th&day=f&Campus=Any&command=search\" \n	and xpath=\"//div[@class='span12']\"";
    encodedYql = encodeYql(yql);
    fullquery = "https://query.yahooapis.com/v1/public/yql?q=" + encodedYql + "&format=json&callback=";
    return $.ajax(fullquery, {
      dataType: "json",
      async: false
    }).done(function(data) {
      var div, t;
      div = data.query.results.div;
      return withData((function() {
        var _i, _len, _ref3, _results;
        _ref3 = _.zip(div.h4, div.table);
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          t = _ref3[_i];
          _results.push(new TC.ClassInstance(t[0], t[1].tbody));
        }
        return _results;
      })());
    });
  };

  TimetableCreator.fetchDepartments = (function() {
    var yql;
    yql = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Fstudentservices.uwo.ca%2Fsecure%2Ftimetables%2Fmastertt%2Fttindex.cfm%22%20and%20xpath%3D%22%2F%2Fselect%5B%40id%3D'inputSubject'%5D%2Foption%5B%40value%20!%3D%20''%5D%22&format=json&callback=";
    return function(withData) {
      return $.getJSON(yql, function(data) {
        return console.log("dept count = " + data.query.count);
      }).done(function(data) {
        var opt;
        return withData((function() {
          var _i, _len, _ref3, _results;
          _ref3 = data.query.results.option;
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            opt = _ref3[_i];
            _results.push({
              title: opt.content,
              value: opt.value,
              total: "" + opt.value + " - " + opt.content
            });
          }
          return _results;
        })());
      });
    };
  })();

}).call(this);
