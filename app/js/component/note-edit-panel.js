'use strict';

angular.module('tabApp').directive('noteEditPanel', function () {
    function NoteEditCtrl() {
        var ctrl = this;

        ctrl.linked = false;

        ctrl.beatChangeType = '=';
        ctrl.beatChangeOptions = ['=', '+', '-'];
        ctrl.beatChangeAmounts = [{label: '1', value: 1}, {label: '\u00bd', value: 0.5},
            {label: '\u00bc', value: 0.25}];
        ctrl.beatChangeValue = ctrl.beatChangeAmounts[0];
        ctrl.moveValue = ctrl.beatChangeAmounts[0];

        ctrl.$onInit = function () {
            console.log('init note edit panel');
        };

        ctrl.$onChanges = function (changes) {
            console.log('changes: ' + JSON.stringify(changes));
            ctrl.note = ctrl.selectedNote.note;
            ctrl.measure = ctrl.selectedNote.measure;
            ctrl.song = ctrl.selectedNote.song;
            ctrl.fret = ctrl.note.fret;

            ctrl.updateState();

            if (ctrl.linked) {
                ctrl.position();
            }
        };

        ctrl.updateState = function () {
            var nextDist = ctrl.measure.findNextNoteDistance(ctrl.note),
                prevDist = ctrl.measure.findPreviousNoteDistance(ctrl.note);

            console.log('next dist ' + nextDist + ' prevDist ' + prevDist);

            ctrl.updateMoveOptions(prevDist, nextDist);
            ctrl.updateBeatOptions(nextDist);

            ctrl.availableStrings = ctrl.measure.allStringOptionsForNote(
                ctrl.note, ctrl.song.strings);
        };

        ctrl.updateMoveOptions = function (prevDist, nextDist) {
            var minDur = 1 / ctrl.measure.getSubdivisions();
            ctrl.canMoveBackward = prevDist > 0;
            ctrl.canMoveForward = (nextDist - minDur > 0);
        };

        ctrl.increaseBeats = function () {
            var nextDist = ctrl.measure.findNextNoteDistance(ctrl.note);
            ctrl.note.dur = Math.min(ctrl.beatChangeValue.value + ctrl.note.dur, nextDist);
            ctrl.updateState();
        };

        ctrl.decreaseBeats = function () {
            var minDur = 1 / ctrl.measure.getSubdivisions();
            ctrl.note.dur = Math.max(ctrl.note.dur - ctrl.beatChangeValue.value, minDur);
            ctrl.updateState();
        };

        ctrl.updateBeatOptions = function (nextDist) {
            var minDur = 1 / ctrl.measure.getSubdivisions();
            ctrl.canDecreaseBeats = (ctrl.note.dur - minDur) > 0;
            ctrl.canIncreaseBeats = (nextDist - ctrl.note.dur) > 0;
        };

        ctrl.moveNoteForward = function () {
            var minDur = 1 / ctrl.measure.getSubdivisions(),
                nextDist = ctrl.measure.findNextNoteDistance(ctrl.note),
                moveIncr = Math.max(Math.min(ctrl.moveValue.value, nextDist - minDur), 0);
            ctrl.note.pos += moveIncr;
            ctrl.setMovedNoteDuration();
            ctrl.updateState();
        };

        ctrl.moveNoteBackward = function () {
            var moveIncr = ctrl.moveValue.value,
                prevDist = ctrl.measure.findPreviousNoteDistance(ctrl.note);
            ctrl.note.pos -= Math.min(moveIncr, prevDist);
            ctrl.updateState();
        };

        ctrl.setMovedNoteDuration = function () {
            var d = ctrl.measure.findNextNoteDistance(ctrl.note);
            ctrl.note.dur = Math.min(ctrl.note.dur, d);
            console.log('dist: ' + d);
        };

        ctrl.setBeats = function () {
            var minDur = 1 / ctrl.measure.getSubdivisions();
            ctrl.note.dur = Math.max(ctrl.beatChangeValue.value, minDur);
            ctrl.updateState();
        };

        ctrl.deleteNote = function () {
            ctrl.measure.deleteNote(ctrl.note);
            ctrl.close();
        };

        ctrl.position = function () {
            console.log('updating position');
            var ch = $(ctrl.element.children()[0]),
                pos = ctrl.selectedNote.position;

            ch.position({
                my: 'center top',
                at: 'left+' + pos.x + ' top+' + (pos.y),
                of: window,
                collision: 'fit'
            });
        };
    }

    return {
        templateUrl: 'partials/note-edit-panel.html',
        controller: NoteEditCtrl,
        link: function (scope, element, attrs) {
            scope.$ctrl.element = element;
            scope.$ctrl.linked = true;
            scope.$ctrl.position();
        },
        bindToController: {
            selectedNote: '<',
            close: '&'
        },
        controllerAs: '$ctrl'
    };

});