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
        };

        ctrl.$onChanges = function (changes) {
            //console.log('changes: ' + JSON.stringify(changes));
            ctrl.note = ctrl.selectedNote.note;
            ctrl.song = ctrl.selectedNote.song;
            ctrl.fret = ctrl.note.fret;
            ctrl.string = ctrl.note.string;

            ctrl.updateState();

            if (ctrl.linked) {
                ctrl.position();
            }
        };

        ctrl.updateNote = function(field, value) {
            ctrl.onUpdate({note: ctrl.note, field: field, value: value});
        };
        
        ctrl.deleteNote = function() {
            ctrl.onDelete({note: ctrl.note});
            ctrl.close();
        };

        ctrl.updateFret = function() {
            ctrl.updateNote('fret', ctrl.fret);
        };
        
        ctrl.updateString = function() {
            ctrl.updateNote('string', ctrl.string);
            ctrl.updateState();
        };
        
        ctrl.updateState = function () {
            var nextDist = ctrl.note.measure.findNextNoteDistance(ctrl.note),
                prevDist = ctrl.note.measure.findPreviousNoteDistance(ctrl.note);

            console.log('next dist ' + nextDist + ' prevDist ' + prevDist);

            ctrl.updateMoveOptions(prevDist, nextDist);
            ctrl.updateBeatOptions(nextDist);

            ctrl.availableStrings = ctrl.note.measure.allStringOptionsForNote(
                ctrl.note, ctrl.song.strings);
        };

        ctrl.updateMoveOptions = function (prevDist, nextDist) {
            var minDur = 1 / ctrl.note.measure.getSubdivisions();
            ctrl.canMoveBackward = prevDist > 0;
            ctrl.canMoveForward = (nextDist - minDur > 0);
        };

        ctrl.increaseBeats = function () {
            ctrl.updateNote('dur', ctrl.beatChangeValue.value + ctrl.note.dur);
            ctrl.updateState();
        };

        ctrl.decreaseBeats = function () {
            ctrl.updateNote('dur', ctrl.note.dur - ctrl.beatChangeValue.value);
            ctrl.updateState();
        };

        ctrl.updateBeatOptions = function (nextDist) {
            var minDur = 1 / ctrl.note.measure.getSubdivisions();
            ctrl.canDecreaseBeats = (ctrl.note.dur - minDur) > 0;
            ctrl.canIncreaseBeats = (nextDist - ctrl.note.dur) > 0;
        };

        ctrl.moveNoteForward = function () {
            ctrl.updateNote('pos', ctrl.moveValue.value);
            ctrl.updateState();
        };

        ctrl.moveNoteBackward = function () {
            ctrl.updateNote('pos', -ctrl.moveValue.value);
            ctrl.updateState();
        };

        ctrl.setBeats = function () {
            ctrl.updateNote('dur', ctrl.beatChangeValue.value);
            ctrl.updateState();
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
        templateUrl: 'partials/components/note-edit-panel.html',
        controller: NoteEditCtrl,
        link: function (scope, element, attrs) {
            scope.$ctrl.element = element;
            scope.$ctrl.linked = true;
            scope.$ctrl.position();
        },
        bindToController: {
            selectedNote: '<',
            close: '&',
            onUpdate: '&',
            onDelete: '&'
        },
        controllerAs: '$ctrl'
    };

});