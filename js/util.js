(function() {
  var _ref, _ref1, _ref2;

  if ((_ref = window.$) == null) {
    window.$ = jQuery;
  }

  if ((_ref1 = window._) == null) {
    window._ = underscore;
  }

  if ((_ref2 = window.Util) == null) {
    window.Util = {
      daysOfTheWeek: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      forAllTimes: (function() {
        return function(eachTime, hourMin) {
          var day, hour, hourStr, min, minStr, _i, _results;
          if (hourMin == null) {
            hourMin = null;
          }
          _results = [];
          for (hour = _i = 8; _i <= 22; hour = ++_i) {
            hourStr = hour >= 10 ? "" + hour : "0" + hour;
            _results.push((function() {
              var _j, _results1;
              _results1 = [];
              for (min = _j = 0; _j <= 59; min = _j += 30) {
                minStr = min >= 10 ? "" + min : "0" + min;
                if (typeof hourMin === "function") {
                  hourMin(hourStr, minStr);
                }
                _results1.push((function() {
                  var _k, _len, _ref3, _results2;
                  _ref3 = Util.daysOfTheWeek;
                  _results2 = [];
                  for (_k = 0, _len = _ref3.length; _k < _len; _k++) {
                    day = _ref3[_k];
                    _results2.push(eachTime(hourStr, minStr, day));
                  }
                  return _results2;
                })());
              }
              return _results1;
            })());
          }
          return _results;
        };
      })(),
      scheduleCellId: function(term, day, hour, min) {
        var hourStr, minStr;
        hourStr = hour < 10 ? "0" + hour : hour;
        minStr = min < 10 ? "0" + min : min;
        return "t" + (Number(term)) + "_t" + hourStr + minStr + "_" + day;
      }
    };
  }

  Util.SimpleTime = (function() {

    function SimpleTime(hours, minutes, isAM) {
      var extraHours;
      if (isAM != null) {
        if (hours === 12) {
          hours = 0;
        }
        hours = hours + (isAM ? 0 : 12);
      }
      this.minute = minutes % 60;
      extraHours = Math.floor(minutes / 60);
      this.hour = (hours + extraHours) % 24;
    }

    SimpleTime.prototype.addHours = function(hours) {
      return new Util.SimpleTime(this.hour + hours, this.minute);
    };

    SimpleTime.prototype.addMinutes = function(minutes) {
      var hoursToAdd, mins, newMins;
      newMins = this.minute + minutes;
      hoursToAdd = Math.floor(newMins / 60);
      if (newMins < 0) {
        newMins += 60;
        hoursToAdd -= 1;
      }
      mins = newMins % 60;
      return new Util.SimpleTime(this.hour + hoursToAdd, mins);
    };

    SimpleTime.prototype.add = function(other) {
      var t;
      t = this.addMinutes(other.minute);
      return t.addHours(other.hour);
    };

    SimpleTime.prototype.dif = function(other) {
      return new Util.SimpleTime(this.hour - other.hour, this.minute - other.minute);
    };

    SimpleTime.prototype.cmp = function(other) {
      var out;
      if (other == null) {
        1;
      }
      out = this.hour - other.hour;
      if (out === 0) {
        out = this.minute - other.minute;
      }
      return out;
    };

    SimpleTime.prototype.gt = function(other) {
      return this.cmp(other) > 0;
    };

    SimpleTime.prototype.lt = function(other) {
      return this.cmp(other) < 0;
    };

    SimpleTime.prototype.lte = function(other) {
      return this.cmp(other) <= 0;
    };

    SimpleTime.prototype.iterateTo = function(other, onStep, step) {
      var curr, out;
      if (step == null) {
        step = new Util.SimpleTime(0, 30);
      }
      curr = this.copy();
      out = [];
      while (curr.lt(other)) {
        out.push(typeof onStep === "function" ? onStep(curr) : void 0);
        curr = curr.add(step);
      }
      return out;
    };

    SimpleTime.prototype.copy = function() {
      return new Util.SimpleTime(this.hour, this.minute);
    };

    return SimpleTime;

  })();

}).call(this);
