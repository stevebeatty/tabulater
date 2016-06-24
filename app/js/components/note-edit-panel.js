'use strict';

angular.module('tabApp').directive('noteEditPanel', [ function () {
    function NoteEditCtrl() {
        var ctrl = this;

        ctrl.linked = false;

        ctrl.beatChangeType = '=';
        ctrl.beatChangeOptions = ['=', '+', '-'];
        ctrl.beatChangeAmounts = [{label: '1', value: 1}, {label: '\u00bd', value: 0.5},
            {label: '\u00bc', value: 0.25}];
        ctrl.beatChangeValue = ctrl.beatChangeAmounts[0];
        ctrl.moveValue = ctrl.beatChangeAmounts[0];

        ctrl.lowStringFret = 0;
        ctrl.hasMultipleSelection = false;

        ctrl.$onInit = function () {
        };

        ctrl.$onChanges = function (changes) {
            console.log('changes: ' + JSON.stringify(changes));
            ctrl.note = ctrl.selectedNote.note;
            ctrl.song = ctrl.note.measure.song;
            ctrl.fret = ctrl.note.fret;
            ctrl.string = ctrl.note.string;

            ctrl.updateState();

            if (ctrl.linked) {
                ctrl.position();
            }
        };

        ctrl.updateNote = function(field, value) {
            if (ctrl.hasMultipleSelection) {
                ctrl.onUpdate({note: ctrl.getNotesFromSelection(), field: field, value: value});
            } else {
                ctrl.onUpdate({note: ctrl.note, field: field, value: value});
            }
        };
        
        ctrl.deleteNote = function() {
            ctrl.onDelete({note: ctrl.note});
            ctrl.close();
        };

        ctrl.updateFret = function() {
            if (ctrl.hasMultipleSelection) {
                ctrl.updateNote('fret', ctrl.fret - ctrl.lowStringFret);
            } else {
                ctrl.updateNote('fret', ctrl.fret);
            }
            ctrl.updateState();
        };
        
        ctrl.updateString = function(dir) {
            ctrl.updateNote('string', dir);
            ctrl.updateState();
        };
        
        ctrl._setEffectiveFret = function (notes) {
            ctrl.lowStringFret = 0;
            var lowString = 0;
            notes.forEach(function(n) {
                // find the effective low string and the fret on that string
               if (n.string > lowString) {
                   lowString = n.string;
                   ctrl.lowStringFret = n.fret;
               } else if (n.string === lowString) {
                   if (n.fret > ctrl.lowStringFret) {
                       ctrl.lowStringFret = n.fret;
                   }
               }
            });
            
            ctrl.fret = ctrl.lowStringFret;
        };
        
        ctrl._hasDupeStrings = function(notes) {
            var sameStringSelected = false,
                usedStrings = {};
            notes.forEach(function(n) {
               if (n.string in usedStrings) {
                   sameStringSelected = true;
               } else {
                   usedStrings[n.string] = true;
               }
            });
            
            return sameStringSelected;
        };
        
        ctrl.updateState = function () {
            var notes = ctrl.getNotesFromSelection(),
                allNextDist = notes.map(function(note) {
                                    return note.measure.findNextNoteDistance(note, '', notes);
                               }),
                allPrevDist = notes.map(function(note) {
                                    return note.measure.findPreviousNoteDistance(note, '', notes);
                               }),
                allMinDur =   notes.map(function(note){
                                    return 1 / note.measure.getSubdivisions();
                               });
                               
            ctrl._setEffectiveFret(notes);
            var sameStringSelected = ctrl._hasDupeStrings(notes);
            
            ctrl.hasMultipleSelection = notes.length > 1;
            
            var nextDist = Math.min.apply(null, allNextDist),
                prevDist = Math.min.apply(null, allPrevDist),
                minDur = Math.max.apply(null, allMinDur);

            console.log('next dist ' + nextDist + ' prevDist ' + prevDist + ' mindur: ' + minDur);

            ctrl.updateMoveOptions(prevDist, nextDist, minDur, sameStringSelected);
            ctrl.updateBeatOptions(nextDist, minDur);
            ctrl.updateStringOptions(notes);
            
            ctrl.availableStrings = ctrl.note.measure.allStringOptionsForNote(
                ctrl.note, ctrl.song.strings, notes);
        };

        ctrl.getNotesFromSelection = function () {
            return ctrl.selectedNotes.map(function(sel){
                return sel.note;
            });
        };

        ctrl.updateMoveOptions = function (prevDist, nextDist, minDur, dupeStringSelected) {
            ctrl.canMoveBackward = dupeStringSelected ? false : prevDist > 0;
            ctrl.canMoveForward = dupeStringSelected ? false : (nextDist - minDur > 0);
        };
        
        ctrl.updateStringOptions = function (notes) {
            // can the notes be moved up or down on the strings
            var stringOps = notes.reduce(function(total, n) {
                var ops = n.measure.allStringOptionsForNote(n, ctrl.song.strings, notes);
                total.up = total.up && (ops.indexOf(n.string - 1) >= 0);
                total.down = total.down && (ops.indexOf(n.string + 1) >= 0);
                console.log(ops);
                return total;
            }, {'up': true, 'down': true});

            console.log(stringOps);
            ctrl.canMoveStringUp = stringOps.up;
            ctrl.canMoveStringDown = stringOps.down;
        };

        ctrl.increaseBeats = function () {
            ctrl.updateNote('durInc', ctrl.beatChangeValue.value);
            ctrl.updateState();
        };

        ctrl.decreaseBeats = function () {
            ctrl.updateNote('dur', -ctrl.beatChangeValue.value);
            ctrl.updateState();
        };

        ctrl.updateBeatOptions = function (nextDist, minDur) {
            ctrl.canDecreaseBeats = ctrl.selectedNotes.every(function(sel) {
                return (sel.note.dur - minDur) > 0;
            });
            ctrl.canIncreaseBeats = ctrl.selectedNotes.every(function(sel) {
                return (nextDist - sel.note.dur) > 0;
            });
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
            
            scope.$watchCollection('$ctrl.selectedNotes', function(newValues, oldValues) {
                console.log('watching.');
                scope.$ctrl.updateState();
            });
            
            scope.$ctrl.position();
        },
        bindToController: {
            selectedNote: '<',
            selectedNotes: '<',
            close: '&',
            onUpdate: '&',
            onDelete: '&'
        },
        controllerAs: '$ctrl'
    };

}]);