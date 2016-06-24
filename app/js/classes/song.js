'use strict';

angular.module('tabApp')
    .factory('Song', ['Measure', function (Measure) {

        function Song(obj) {
            this.measures = [];
            this.rulers = {};

            if (angular.isObject(obj)) {
                this.subdivisions = obj.subdivisions || 1;
                this.tempo = obj.tempo || 120;
                this.name = obj.name;
                this.by = obj.by;

                if (angular.isNumber(obj.frets)) {
                    this.setFrets(obj.frets);
                }

                if (angular.isNumber(obj.strings)) {
                    this.setStrings(obj.strings);
                }

                this.beatCount = obj.beatCount;
                this.beatType = obj.beatType;

                if (angular.isArray(obj.measures)) {
                    // create measures first
                    for (var i = 0; i < obj.measures.length; i++) {
                        this.pushMeasure(new Measure(null, this));
                    }
                    
                    // then set the measure content
                    for (var i = 0; i < obj.measures.length; i++) {
                        this.measures[i].setPropertiesFromObject(obj.measures[i]);
                    }
                }
            } else {
                this.strings = [];
                this.frets = [];
            }
        }

        Song.prototype.getBeatCount = function () {
            return this.beatCount;
        };

        Song.prototype.getBeatType = function () {
            return this.beatType;
        };

        Song.prototype.pushMeasure = function (measure) {
            this.measures.push(measure);
            this.setMeasureSong(measure);
            this.linkMeasureBefore(this.measures.length - 1);
            measure.nextMeasure = null;
        };

        Song.prototype.insertMeasureBefore = function (measure, toInsert) {
            console.log('inserting');
            var idx = this.measures.indexOf(measure);
            this.measures.splice(idx, 0, toInsert);
            this.setMeasureSong(toInsert);
            this.linkMeasures(idx);
        };

        Song.prototype.insertMeasureAfter = function (measure, toInsert) {
            var idx = this.measures.indexOf(measure) + 1;
            this.measures.splice(idx, 0, toInsert);
            this.setMeasureSong(toInsert);
            this.linkMeasures(idx);
        };

        Song.prototype.setMeasureSong = function (measure) {
            measure.song = this;
        };

        Song.prototype.linkMeasures = function (index) {
            this.linkMeasureBefore(index);
            this.linkMeasureAfter(index);
        };

        Song.prototype.linkMeasureBefore = function (index) {
            var measure = this.measures[index];
            if (index <= 0) {
                measure.prevMeasure = null;
            } else {
                measure.prevMeasure = this.measures[index - 1];
                this.measures[index - 1].nextMeasure = measure;
            }
        };

        Song.prototype.linkMeasureAfter = function (index) {
            var measure = this.measures[index];
            if (index >= this.measures.length - 1) {
                measure.nextMeasure = null;
            } else {
                measure.nextMeasure = this.measures[index + 1];
                this.measures[index + 1].prevMeasure = measure;
            }
        };

        Song.prototype.numberSequence = function (start, end) {
            var arr = [];
            for (var i = start; i <= end; i++) {
                arr.push(i);
            }

            return arr;
        };

        Song.prototype.setStrings = function (count) {
            this.strings = this.numberSequence(1, count);
        };

        Song.prototype.setFrets = function (count) {
            this.frets = this.numberSequence(0, count);
        };

        Song.prototype.deleteMeasure = function (measure) {
            var idx = this.measures.indexOf(measure);
            if (idx >= 0) {
                this.measures.splice(idx, 1);
                if (this.measures.length > 0) {
                    this.linkMeasureBefore(idx);
                }
            }
        };
        
        Song.prototype._insertBetween = function (arr, value) {
            var size = 2 * arr.length;
            for (var i = 1; i < size; i += 2) {
                arr.splice(i, 0, value);
            }
        };
        
        Song.prototype.getRuler = function (beatCount, subdivision) {
            var index = beatCount + '/' + subdivision;

            if (index in this.rulers) {
                return this.rulers[index];
            } else {
                var r;
                if (subdivision === 1) {
                    r = new Array(beatCount).fill(1);
                } else {
                    r = this.getRuler(beatCount, subdivision / 2).slice();
                    this._insertBetween(r, subdivision);
                }

                this.rulers[index] = r;
                return r;
            }
        };

        Song.prototype.toJSON = function () {
            return {
                name: this.name,
                by: this.by,
                subdivisions: this.subdivisions,
                tempo: this.tempo,
                beatType: this.beatType,
                beatCount: this.beatCount,
                measures: this.measures,
                strings: this.strings[this.strings.length - 1],
                frets: this.frets[this.frets.length - 1]
            };
        };

        return Song;

    }]);