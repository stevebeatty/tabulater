'use strict';

angular.module('tabApp').component('songDisplay', {
    templateUrl: 'partials/components/song-display.html',
    require: {
        parent: '^tabulater'
    },
    controller: function () {
        var ctrl = this;

        ctrl.stringsTopOffset = 1;

        ctrl.noteCircleRadius = 0.6;
        ctrl.stringOffset = ctrl.noteCircleRadius * 2;

        ctrl.sideOffset = ctrl.noteCircleRadius * 2;
        ctrl.subdivisionOffset = ctrl.noteCircleRadius * 2.5;

        ctrl.$onInit = function () {
            console.log('init song display parent: ' + Object.keys(ctrl.parent));
        };

        // 1, 8, 4, 8, 2, 8, 4, 8, 1, 8 ...
        // 1, 4, 2, 4, 1, 4, 2, 4, 1, 4 ...
        // 1, 2, 1, 2, 1, 2
        // 1, 1, 1, 1
        ctrl.rulers = {};

        ctrl.insertBetween = function (arr, value) {
            var size = 2 * arr.length;
            for (var i = 1; i < size; i += 2) {
                arr.splice(i, 0, value);
            }
        };

        ctrl.clickLine = function (event, string, measure) {
            console.log('click string ' + string);
            console.log(event);

            if (!ctrl.parent.editSong)
                return;

            var bound = event.target.getBoundingClientRect(),
                x = event.clientX - bound.left,
                w = x / bound.width,
                pos = ctrl.closestNotePosition(measure, w),
                note = {pos: pos, string: string, fret: 0},
                dur = measure.findNextNoteDistance(note);

            if (dur === 0) {
                console.log('cannot place new note - currently occupied');
                return;
            }

            note.dur = Math.min(dur, ctrl.parent.lastNoteDuration);

            var rulerEl = ctrl.closestRuler(event.target),
                n = measure.addNoteFromObject(note),
                p = ctrl.noteXPosition(measure, pos) / (ctrl.measureWidth(measure)),
                center = $(rulerEl).position().left + rulerEl.getBBox().width * p,
                position = {x: center,
                    y: rulerEl.getBoundingClientRect().bottom};

            ctrl.parent.selectNote(n, measure, position);
        };

        ctrl.clickMeasure = function (event, measure) {
            console.log('click measure');
            if (!ctrl.parent.editSong)
                return;

            var measureEl = $(event.target).closest('.measure'),
                rulerEl = measureEl.children('.ruler');

            ctrl.parent.selectMeasure(measure, rulerEl);
        };

        ctrl.clickNote = function (event, note, measure) {
            if (!ctrl.parent.editSong)
                return;

            var rulerEl = ctrl.closestRuler(event.target),
                el = $(event.target)[0],
                bound = el.getBoundingClientRect(),
                pos = {x: (bound.left + bound.width / 2),
                    y: rulerEl.getBoundingClientRect().bottom};

            ctrl.parent.selectNote(note, measure, pos);
        };

        ctrl.stringYOffset = function (stringNum) {
            return ctrl.stringsTopOffset + (stringNum - 1) * ctrl.stringOffset;
        };

        ctrl.topStringYOffset = function () {
            return ctrl.stringYOffset(1);
        };

        ctrl.bottomStringYOffset = function () {
            return ctrl.stringYOffset(ctrl.parent.song.strings.length);
        };

        ctrl.stringClickBoxBottom = function (string) {
            return ctrl.stringYOffset(string) - 0.2 * ctrl.stringOffset;
        };

        ctrl.stringClickBoxHeight = function () {
            return 0.4 * ctrl.stringOffset;
        };

        ctrl.measureHeight = function () {
            return ctrl.rulerBottom() + ctrl.stringsTopOffset;
        };

        ctrl.measureWidth = function (measure) {
            return 1.5 * ctrl.sideOffset + measure.getSubdivisions() * ctrl.subdivisionOffset * measure.getBeatCount();
        };

        ctrl.measureClickBoxHeight = function () {
            return ctrl.bottomStringYOffset() - ctrl.topStringYOffset();
        };

        ctrl.measureClickBoxWidth = function () {
            return 0.6;
        };

        /**
         * Finds the X position on a string in a measure for a given 
         * note position
         * @param {type} measure
         * @param {type} pos
         * @returns {Number|ctrl.noteCircleRadius}
         */
        ctrl.noteXPosition = function (measure, pos) {
            return ctrl.sideOffset + ctrl.notePositionDistance(measure, pos, 1);
        };

        ctrl.notePositionDistance = function (measure, pos1, pos2) {
            var maxPos = measure.getBeatCount(),
                    posDiff = Math.abs(pos2 - pos1),
                    result = posDiff * ctrl.subdivisionOffset * measure.getSubdivisions();
            
                if (posDiff > maxPos) {
                    console.log("max pos < result : " + maxPos + " < " + result);
                }
            return result;
        };

        ctrl.noteDurationDistance = function (measure, note) {
            var dur = note.dur || 1;
            var maxDur = measure.getBeatCount() - note.pos + 1;
            if (dur > maxDur) {
                    console.log("max maxDur < dur : " + maxDur + " < " + dur);
                }
            var re = ctrl.notePositionDistance(measure, Math.min(dur, maxDur), 0);
            return re;
        };

        ctrl.noteDurationBottom = function (string) {
            return ctrl.stringYOffset(string) - 0.05 * ctrl.stringOffset;
        };

        ctrl.noteDurationHeight = function () {
            return 0.1 * ctrl.stringOffset;
        };

        ctrl.noteTextOffset = function () {
            return 0.3;
        };

        ctrl.rulerTickXPosition = function (measure, index) {
            return ctrl.noteXPosition(measure, 1 + index / measure.getSubdivisions());
        };

        ctrl.rulerTickHeight = function (subdiv) {
            return ctrl.rulerBottom() - 0.15 * ctrl.stringOffset - 0.65 * ctrl.stringOffset / subdiv;
        };

        ctrl.rulerBottom = function () {
            return ctrl.stringYOffset(ctrl.parent.song.strings.length + 1) + 0.2*ctrl.stringOffset;
        };

        ctrl.getRuler = function (measure) {
            return ctrl.findOrCreateRuler(measure.getBeatCount(), measure.getSubdivisions());
        };

        ctrl.findOrCreateRuler = function (beatCount, subdivision) {
            var index = beatCount + '/' + subdivision;

            if (index in ctrl.rulers) {
                return ctrl.rulers[index];
            } else {
                var r;
                if (subdivision === 1) {
                    r = new Array(beatCount).fill(1);
                } else {
                    r = ctrl.findOrCreateRuler(beatCount, subdivision / 2).slice();
                    ctrl.insertBetween(r, subdivision);
                }

                ctrl.rulers[index] = r;
                return r;
            }
        };
        
        ctrl.closestRuler = function (el) {
            var measureEl = $(el).closest('.measure');
            return measureEl.children('.ruler')[0];
        };

        ctrl.closestNotePosition = function (measure, xNormalized) {
            var m = ctrl.measureWidth(measure), // the width in em of the measure
                xPos = Math.min(Math.max(xNormalized * m, ctrl.sideOffset), m - ctrl.sideOffset), // the position of the x in the measure
                pos = (xPos - ctrl.sideOffset) / (ctrl.subdivisionOffset * measure.getSubdivisions()) + 1,
                //pos = Math.max(p + 1, 1),
                f = 1 / measure.getSubdivisions(),
                frac = pos % 1,
                ti = Math.floor(frac / f),
                fr = frac === 0 ? 0 : Math.round((frac % f) / f),
                rnd = Math.floor(pos) + ti * f + fr * f,
                clm = Math.min(measure.getBeatCount() + 1 - f, rnd);

            console.log('pos ' + pos + ' ' + frac + ' ' + ti + ' ' + fr + ' r ' + clm);

            return clm;
        };
    }
});
  