(function() {
  var Schedule, cellColours, loadClassSelector, loadTables, schedule, substringMatcher, _ref, _ref1,
    __hasProp = {}.hasOwnProperty;

  if ((_ref = window.$) == null) {
    window.$ = jQuery;
  }

  if ((_ref1 = window._) == null) {
    window._ = lodash;
  }

  substringMatcher = function(depts) {
    return function(q, cb) {
      var d, i, matches, substrRegex, _i, _len;
      matches = [];
      substrRegex = new RegExp(q, 'i');
      for (i = _i = 0, _len = depts.length; _i < _len; i = ++_i) {
        d = depts[i];
        if (substrRegex.test(d.total)) {
          matches.push(d);
        }
      }
      return cb(matches);
    };
  };

  cellColours = [
    {
      back: 'rgb(0, 191, 127)',
      border: 'rgb(0, 127, 85)'
    }, {
      back: 'rgb(191, 181, 0)',
      border: 'rgb(127, 121, 0)'
    }, {
      back: 'rgb(191, 126, 0)',
      border: 'rgb(127, 84, 0)'
    }, {
      back: 'rgb(191, 67, 51)',
      border: 'rgb(127, 45, 34)'
    }, {
      back: 'rgb(191, 34, 163)',
      border: 'rgb(127, 23, 108)'
    }, {
      back: 'rgb(191, 126, 0)',
      border: 'rgb(127, 84, 0)'
    }, {
      back: 'rgb(111, 37, 191)',
      border: 'rgb(74, 25, 127)'
    }, {
      back: 'rgb(35, 83, 191)',
      border: 'rgb(23, 55, 127)'
    }
  ];

  Schedule = (function() {

    function Schedule() {
      var ttable;
      this._timetable = {};
      ttable = this._timetable;
      Util.forAllTimes(function(hour, min, day) {
        var _ref2;
        if ((_ref2 = ttable[day]) == null) {
          ttable[day] = {};
        }
        return ttable["" + hour + min] = {
          busy: false
        };
      });
    }

    Schedule.prototype.addClass = function(component) {
      var cell, cellColour, div, id, rows, start, time, _i, _len, _ref2;
      cellColour = cellColours[Math.floor(Math.random() * cellColours.length)];
      _ref2 = component.times;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        time = _ref2[_i];
        console.log("working with:", time);
        rows = time.iterate().length;
        if (rows === 0) {
          throw new Exception("rows == 0");
        }
        start = time.startTime;
        id = Util.scheduleCellId(time["class"].term, time.day, start.hour, start.minute);
        console.log("Setting id=" + id + " w/ span: " + rows);
        cell = $("#" + id);
        cell.attr('rowspan', rows);
        cell.addClass('class');
        cell.css({
          'border-color': cellColour.border,
          'background-color': cellColour.back
        });
        div = $(cell).$div();
        div.$h5("" + component["class"].courseCode);
        div.$p("" + component.type + " " + component.section);
      }
      return void 0;
    };

    return Schedule;

  })();

  schedule = new Schedule;

  loadClassSelector = function() {
    var departments;
    departments = [];
    TimetableCreator.fetchDepartments(function(data) {
      var d, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        d = data[_i];
        _results.push(departments.push(d));
      }
      return _results;
    });
    return (function() {
      var courseCache, selected;
      selected = {
        dept: (function() {
          var _reg;
          _reg = /([A-Z]+)\s+\-\s+/;
          return function() {
            var groups, _ref2;
            groups = (_ref2 = $("#classDept")) != null ? _ref2.val().match(_reg) : void 0;
            return groups[1];
          };
        })(),
        "class": function() {
          var courseCode, dept, _ref2;
          courseCode = (_ref2 = $("#classSelect option:selected")) != null ? _ref2.val() : void 0;
          dept = this.dept();
          console.Log("department = " + dept);
          if (courseCode != null) {
            return _.findWhere(courseCache.get(this.dept()), {
              courseCode: courseCode
            });
          }
        },
        lecture: function() {
          var lectureSection, _ref2;
          lectureSection = (_ref2 = $("#lectureSelect option:selected")) != null ? _ref2.val() : void 0;
          if (lectureSection != null) {
            return _.findWhere(this["class"]().getLectures(), {
              section: lectureSection
            });
          } else {
            return null;
          }
        },
        extra: function() {
          var extraSection, _ref2;
          extraSection = (_ref2 = $("#extraSelect option:selected")) != null ? _ref2.val() : void 0;
          if (extraSection != null) {
            return _.findWhere(this["class"]().getExtras(), {
              section: extraSection
            });
          } else {
            return null;
          }
        }
      };
      courseCache = new Util.LRUCache(5, function(deptCode) {
        var currentClasses;
        currentClasses = [];
        TimetableCreator.fetchClasses(deptCode, function(classes) {
          return currentClasses = classes;
        });
        return currentClasses;
      });
      $("#classDept").typeahead({
        hint: true,
        highlight: true,
        minLength: 2
      }, {
        name: "departments",
        displayKey: "total",
        source: substringMatcher(departments)
      }).bind('typeahead:selected', function(obj, selected, name) {
        var clazz, currentClasses, select, _i, _len;
        if (selected == null) {
          console.error("selected invalid dept: " + selected + ", " + name);
        }
        select = $("#classSelect");
        select.find('option').remove().end();
        select.prop('disabled', true);
        currentClasses = courseCache.get(selected.value);
        for (_i = 0, _len = currentClasses.length; _i < _len; _i++) {
          clazz = currentClasses[_i];
          $(select).$option(clazz.fullTitle, {
            value: clazz.courseCode
          });
        }
        return select.prop('disabled', false);
      });
      $("#classSelect").change(function(event) {
        var clazz, ext, extras, lectures, obj, section, sel, _i, _j, _len, _len1, _ref2, _ref3, _ref4;
        clazz = selected["class"]();
        lectures = $("#lectureSelect");
        extras = $("#extraSelect");
        _ref2 = [lectures, extras];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          sel = _ref2[_i];
          sel.find('option').remove();
          sel.prop('disabled', true);
        }
        _ref3 = _.indexBy(clazz.getLectures(), 'section');
        for (section in _ref3) {
          if (!__hasProp.call(_ref3, section)) continue;
          obj = _ref3[section];
          $(lectures).$option("LEC " + section, {
            value: section
          });
        }
        if (clazz.hasExtras()) {
          _ref4 = clazz.getExtras();
          for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
            ext = _ref4[_j];
            $(extras).$option("" + ext.type + " " + ext.section, {
              value: ext.section
            });
          }
          extras.prop('disabled', false);
        }
        return lectures.prop('disabled', false);
      });
      $("#lectureSelect").change(function(event) {
        return schedule.addClass(selected.lecture());
      });
      return $("#extraSelect").change(function(event) {
        return schedule.addClass(selected.extra());
      });
    })();
  };

  loadTables = function() {
    var body, container, headRow, header, headers, i, table, termStr, _i, _j, _len, _len1, _ref2, _results;
    headers = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];
    _ref2 = $("#term_container > div");
    _results = [];
    for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
      container = _ref2[i];
      table = $(container).$table({
        "class": "table"
      });
      termStr = "t" + i;
      headRow = table.$thead().$tr();
      for (_j = 0, _len1 = headers.length; _j < _len1; _j++) {
        header = headers[_j];
        headRow.$th(header, {});
      }
      body = table.$tbody();
      _results.push(Util.forAllTimes(function(hour, min, day) {
        return $("#" + termStr + "_t" + hour + min).$td({
          id: "" + termStr + "_t" + hour + min + "_" + day
        });
      }, function(hour, min) {
        var tr;
        tr = body.$tr({
          id: "" + termStr + "_t" + hour + min
        });
        return tr.$th("" + hour + ":" + min, {
          id: "" + termStr + "_t" + hour + min
        });
      }));
    }
    return _results;
  };

  jQuery(function() {
    loadTables();
    return loadClassSelector();
  });

}).call(this);
