'use strict';

angular.module('tabApp')
    .factory('Measure', ['Note', function (Note) {

        function Measure(obj, song) {
            this.content = [];
            this.continuedNotes = [];
            this.song = song;
            if (angular.isObject(obj)) {
                this.setPropertiesFromObject(obj);
            }
        }

        Measure.prototype.setPropertiesFromObject = function(obj) {
            this.beatType = obj.beatType;
            this.beatCount = obj.beatCount;
            
            this.setSubdivisions(obj.subdivisions);

            if (angular.isArray(obj.content)) {
                for (var i = 0; i < obj.content.length; i++) {
                    this.content.push(new Note(obj.content[i]));
                }
            }
            this.sortMeasure();
        };

        Measure.prototype.sortMeasure = function () {
            this.content.sort(function (a, b) {
                var d = a.pos - b.pos;
                if (d !== 0)
                    return d;

                return a.string - b.string;
            });
        };

        Measure.prototype.addNoteFromObject = function (note) {
            var n = new Note(note);
            this.content.push(n);
            this.sortMeasure();
            
           // console.log('note bounds: ' + this.getNoteBounds(note));
            
            return n;
        };

        Measure.prototype.addNotesFromList = function(list) {
            for (var i = 0; i < list.length; i++) {
                var n = new Note(list[i]);
                this.content.push(n);
                this.checkNoteBounds(n);
            }
            
            this.sortMeasure();
        };
        
        Measure.prototype.getNoteBounds = function(note) {
            // remainder in this measure
            var extra = (note.pos + note.dur - 1) - this.getBeatCount();
            var _arr = [];
            if (extra > 0) {
                console.log('note outside measure, extra: ' + extra + ', dur: ' + note.dur + ' m:' + this.nextMeasure);
                
                if (this.nextMeasure) {
                    var n = new Note(note);
                    n.dur = extra;
                    n.pos = 1;
                    _arr.push({
                        measure: this,
                        dur: this.getBeatCount() - note.pos + 1
                    });
                    return this.nextMeasure._getNoteDurFromStart(n, _arr);
                } else if (_arr) {
                    _arr.push({
                        measure: this,
                        dur: extra
                    });
                    return _arr;
                }
            }
            
            _arr.push({
                measure: this,
                dur: note.dur
            });
            return _arr;
        };

        Measure.prototype._getNoteDurFromStart = function(note, _arr) {
            // for each measure the note spans
            var extra = note.dur - this.getBeatCount();
                console.log('*note x measure, extra: ' + extra + ', dur: ' + note.dur + ' m:' + this.nextMeasure);
            if (extra > 0) {
                if (this.nextMeasure) {
                    note.dur = extra;
                    _arr.push({
                        measure: this,
                        dur: this.getBeatCount()
                    });
                    return this.nextMeasure._getNoteDurFromStart(note, _arr);
                } else {
                    _arr.push({
                        measure: this,
                        dur: extra
                    });
                    return _arr;
                }
            }
            
            _arr.push({
                measure: this,
                dur: note.dur
            });
            return _arr;
        };

        Measure.prototype._addContinuedNote = function(origin, note) {
            this.continuedNotes.push({ origin: origin, note: note });
        };
        
        Measure.prototype._deleteContinuedNote = function(origin) {
            for (var i = this.continuedNotes.length - 1; i >= 0; i--) {
                var entry = this.continuedNotes[i];
                if (entry.origin === origin) {
                    this.continuedNotes.splice(i, 1);
                }
            }
        };

        Measure.prototype.deleteNote = function (note) {
            var idx = this.content.indexOf(note);
            if (idx >= 0) {
                this.content.splice(idx, 1);
                this.sortMeasure();
            }
        };
        
        /**
         * Moves a note to a string and sets the duration so that it 
         * does not overlap with another note.  It is assumed that the string
         * can be moved to.
         * 
         * @param {type} note
         * @param {type} string
         * @returns {undefined}
         */
        Measure.prototype.setNoteString = function(note, string) {
            this.onNoteMoving(note);
            note.string = string;
            this.onNoteMoved(note);
        };
        
        Measure.prototype.setMovedNoteDuration = function (note) {
            var d = this.findNextNoteDistance(note);
            note.dur = Math.min(note.dur, d);
            
            this.onNoteMoved(note);
            
            console.log('dist: ' + d);
        };
        
        Measure.prototype.onNoteMoving = function (note) {
            this.setMovedNoteDuration(note);
            
            var bounds = this.getNoteBounds(note);  
            // for the 2nd and up measure, remove the reference
            for (var i = 1; i < bounds.length; i++) {
                var measure = bounds[i].measure;
                measure._deleteContinuedNote(note);
            }
            console.log('note bounds: ' + JSON.stringify(this._getNoteDuration(bounds)));
        };
        
        Measure.prototype._getNoteDuration = function(bounds) {
            var dur = [];
            for (var i = 0; i < bounds.length; i++) {
                dur.push(bounds[i].dur);
            }
            return dur;
        };
        
        Measure.prototype.onNoteMoved = function (note) {
            var bounds = this.getNoteBounds(note);  
            // for the 2nd and up measure, remove the reference
            for (var i = 1; i < bounds.length; i++) {
                var measure = bounds[i].measure;
                measure._addContinuedNote(note);
            }
            console.log('note bounds: ' + this._getNoteDuration(bounds));
        };

        Measure.prototype.setNoteDuration = function(note, duration) {
            var nextDist = this.findNextNoteDistance(note),
                minDur = 1 / this.getSubdivisions();
            note.dur = Math.max(Math.min(duration, nextDist), minDur);
            console.log('note bounds: ' + this.getNoteBounds(note));
        };

        Measure.prototype.moveNotePosition = function (note, amount) {
            var moveIncr;
            if (amount >= 0) {
                var minDur = 1 / this.getSubdivisions(),
                    nextDist = this.findNextNoteDistance(note);
                moveIncr = Math.max(Math.min(amount, nextDist - minDur), 0);
            } else {
                var prevDist = this.findPreviousNoteDistance(note);
                moveIncr = Math.max(amount, -prevDist);
            }
            
            this.onNoteMoving(note);
            note.pos += moveIncr;
            this.onNoteMoved(note);
        };

        Measure.prototype.getSubdivisions = function () {
            return this.subdivisions || this.song.subdivisions;
        };

        Measure.prototype.setSubdivisions = function (value) {
            // if the measure and the song have the same value then clear the measure
            if (this.song && value === this.song.subdivisions) {
                if (this.subdivisions)
                    delete this.subdivisions;
            } else {
                this.subdivisions = value;
            }
        };

        Measure.prototype.getBeatCount = function () {
            return this.beatCount || this.song.beatCount;
        };

        Measure.prototype.getBeatType = function () {
            return this.beatType || this.song.beatType;
        };

        /**
         * 
         * @param {type} note
         * @param {type} string
         * @returns {Number}
         */
        Measure.prototype.findPreviousNoteDistance = function (note, string) {
            string = string || note.string;

            // start from right and find the first note before the pos of our note
            // that is on the same string 
            for (var i = this.content.length - 1; i >= 0; i--) {
                var n = this.content[i];
                if (n.string !== string || n === note || n.pos > note.pos) {
                    continue;
                }
                // once that note is found return the distance
                var dist = note.pos - n.pos - n.dur;
                return (dist < 0) ? 0 : dist;
            }
            // no note, so return distance to start of measure
            return note.pos - 1;
        };

        /**
         * 
         * @param {type} note
         * @param {type} string
         * @returns {Number}
         */
        Measure.prototype.findNextNoteDistance = function (note, string) {
            string = string || note.string;

            // start from left and find the first note after the pos of our note
            // that is on the same string
            for (var i = 0; i < this.content.length; i++) {
                var n = this.content[i];
                if (n.string !== string || n === note) {
                    continue;
                }
                // once that note is found return the difference in pos
                if (n.pos > note.pos)
                    return n.pos - note.pos;
                // if a note overlaps our note then zero duration
                if (n.pos + n.dur > note.pos)
                    return 0;
            }
            
            var outsideMeasureDist = 0;
            if (this.nextMeasure) {
                var n = new Note(note);
                n.pos = 1;
                outsideMeasureDist = this.nextMeasure.findNextNoteDistance(n);
                //console.log('has next measure dist: ' + outsideMeasureDist);
            }
            // no note found, so return space left in measure
            return outsideMeasureDist + this.getBeatCount() - note.pos + 1;
        };

        /**
         * 
         * @param {type} note
         * @param {type} strings
         * @returns {Array}
         */
        Measure.prototype.allStringOptionsForNote = function (note, strings) {
            var blockedStrings = {};

            // start from left and find a note that has an overlapping interval
            for (var i = 0; i < this.content.length; i++) {
                var n = this.content[i];
                // continue if the note.pos is outside another note's interval
                // occurring at the end of interval is ok, but not at the beginning
                if (n.string === note.string || note.pos >= n.pos + n.dur || note.pos < n.pos) {
                    continue;
                }

                // if not it's blocked
                blockedStrings[n.string] = true;
            }

            // include the ones that aren't blocked
            var availStrings = [];
            for (var j = 0; j < strings.length; j++) {
                var str = strings[j];
                if (!blockedStrings.hasOwnProperty(str)) {
                    availStrings.push(str);
                }
            }

            return availStrings;
        };

        Measure.prototype.minSubdivision = function () {
            var min = this.getBeatCount();

            this.content.forEach(function (e) {
                // find the note with the shortest duration
                if (e.dur < min) {
                    min = e.dur;
                }

                // find the note with a subdivision offset
                var rem = e.pos % 1;
                if (rem > 0 && rem < min) {
                    min = rem;
                }
            });

            return Math.round(1 / min);
        };

        Measure.prototype.toJSON = function () {
            return {
                beatType: this.beatType,
                beatCount: this.beatCount,
                content: this.content,
                subdivisions: this.sudivisions
            };
        };

        return Measure;

    }]);