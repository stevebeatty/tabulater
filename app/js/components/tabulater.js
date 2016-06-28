'use strict';

angular.module('tabApp').component('tabulater', {
    templateUrl: 'partials/components/tabulater.html',
    controllerAs: 'tabCtrl',
    controller: ['$scope', '$uibModal', 'Measure', 'Song', 'Note', 'soundService',
        function ($scope, $uibModal, Measure, Song, Note, soundService) {

            var ctrl = this;

            soundService.initialize();
            soundService.loadSounds();
            soundService.loadSong('songs/plush.json').then(function () {
                ctrl.song = soundService.song;
            });

            ctrl.selectedMeasure = null;
            ctrl.selectedNote = null;
            ctrl.selectedNotes = [];
            ctrl.selectedRulerTick = null;
            
            ctrl.referenceMeasure = null;
            ctrl.referenceNotes = [];

            ctrl.editSong = false;
            
            ctrl.lastNoteDuration = 1;

            ctrl.unselectAll = function() {
                ctrl.unselectMeasure();
                ctrl.unselectNote();
                ctrl.unselectRulerTick();
            };

            ctrl.selectMeasure = function (measure, posEl) {
                ctrl.unselectAll();

                ctrl.selectedMeasure = {measure: measure, element: posEl};
                measure.selected = true;
            };

            ctrl.unselectMeasure = function () {
                console.log('unselect measure');
                if (ctrl.selectedMeasure) {
                    ctrl.selectedMeasure.measure.selected = false;
                    ctrl.selectedMeasure = null;
                }
            };

            ctrl.setReferenceMeasure = function(measure) {
                ctrl.referenceMeasure = measure;
            };

            ctrl.insertMeasure = function (where) {
                if (where === 'before') {
                    soundService.song.insertMeasureBefore(ctrl.selectedMeasure.measure,
                    new Measure({}, soundService.song));
                } else {
                    soundService.song.insertMeasureAfter(ctrl.selectedMeasure.measure, 
                    new Measure({}, soundService.song));
                }
            };
            
            ctrl.pasteMeasure = function (where) {
                if (where === 'before') {
                    soundService.song.insertMeasureBefore(ctrl.selectedMeasure.measure, 
                    new Measure(ctrl.referenceMeasure, soundService.song));
                } else {
                    soundService.song.insertMeasureAfter(ctrl.selectedMeasure.measure, 
                    new Measure(ctrl.referenceMeasure, soundService.song));
                }
            };

            ctrl.pasteNotes = function (pos, measure) {
                console.log('paste at: ' + pos);
                var notes = ctrl.referenceNotes.map(function (n) {
                    var nt = new Note(n.note);
                    nt.pos = pos;
                    
                    return nt;
                });
                
                console.log(notes);
                notes.forEach(function(n) {
                    measure.addNote(n);
                });
            };

            ctrl.deleteSelectedMeasure = function () {
                ctrl.openConfirmDialog(
                    'Delete Measure', 
                    'Are you sure you want to delete this measure?', 
                    function () {
                        if (ctrl.selectedMeasure) {
                            soundService.song.deleteMeasure(ctrl.selectedMeasure.measure);
                            ctrl.selectedMeasure = null;
                        }
                    });
            };

            ctrl.selectNote = function (note, position) {
                ctrl.unselectAll();
                
                ctrl.selectedNote = ctrl._setNoteSelection(note, position);
                console.log('selected note: ' + JSON.stringify(note));
                
                ctrl.selectedNotes.push(ctrl.selectedNote);
            };
            
            ctrl.selectNotes = function (notes, position) {
                ctrl.unselectAll();
                
                notes.forEach(function (n) {
                    var sel = ctrl._setNoteSelection(n, position);
                    ctrl.selectedNotes.push(sel);
                });
                
                ctrl.selectedNote = ctrl.selectedNotes[0];
            };
            
            ctrl.toggleNoteSelection = function(note, pos) {
                var selPos = ctrl.selectedNotes.findIndex(function(el){
                    if(el.note === note) {
                        return true;
                    }
                    
                    return false;
                });
                
                if (selPos >= 0) { // already selected
                    var removed = ctrl.selectedNotes.splice(selPos, 1);
                    removed.forEach(function(sel) {
                        ctrl._unsetNoteSelection(sel);
                    });
                } else {
                    ctrl.selectedNotes.push(ctrl._setNoteSelection(note, pos));
                }
            };
            
            ctrl._setNoteSelection = function(note, pos) {
                var sel = {note: note, position: pos};
                note.selected = true;
                return sel;
            };
            
            ctrl.unselectAllNotes = function() {
                ctrl.selectedNotes.forEach(function(sel){
                    ctrl._unsetNoteSelection(sel);
                });
                
                ctrl.selectedNotes.length = 0;
            };
            
            ctrl._unsetNoteSelection = function(noteSel) {
                noteSel.note.selected = false;
            };

            ctrl.unselectNote = function () {
                if (ctrl.selectedNote) {
                    ctrl._unsetNoteSelection(ctrl.selectedNote);
                    ctrl.selectedNote = null;
                }
                
                ctrl.unselectAllNotes();
            };
            
            ctrl.setReferenceNotes = function() {
                ctrl.referenceNotes.length = 0;
                Array.prototype.push.apply(ctrl.referenceNotes, ctrl.selectedNotes);
                console.log('reference notes set');
            };
            
            ctrl.selectRulerTick = function (tick, measure, posEl) {
                ctrl.unselectAll();

                ctrl.selectedRulerTick = {tick: tick, measure: measure, element: posEl};
                tick.selected = true;
            };

            ctrl.unselectRulerTick = function () {
                console.log('unselect ruler tick');
                if (ctrl.selectedRulerTick) {
                    ctrl.selectedRulerTick.tick.selected = false;
                    ctrl.selectedRulerTick = null;
                }
            };
            
            ctrl.updateNote = function(note, field, value) {
                // check for multiple update
                if (angular.isArray(note) && note.length > 1) {
                    return ctrl.updateNotes(note, field, value);
                }
                
                var measure = note.measure;
                console.log('update note: ' + note + ' field ' + field + ' value ' + value);
                
                switch (field) {
                    case 'string':
                        measure.setNoteString(note, note.string + value);
                        break;
                    case 'dur':
                        measure.setNoteDuration(note, value);
                        ctrl.lastNoteDuration = note.dur;
                        break;
                    case 'durInc':
                        measure.setNoteDuration(note, note.dur + value);
                        ctrl.lastNoteDuration = note.dur;
                        break;
                    case 'pos':
                        measure.moveNotePosition(note, value);
                        break;
                    case 'fret':
                        note.fret = value;
                        break;
                }
            };
            
            ctrl.updateNotes = function(notes, field, value) {
                notes.forEach(function(n) {
                    switch (field) {
                        // offset the current fret by a value
                        case 'fret': 
                            n.fret = Math.max(n.fret + value, 0);
                            break;
                        // should not be on the same string due to ordering issues
                        case 'pos': 
                            n.measure.moveNotePosition(n, value, notes);
                            break;
                        // directly set notes' duration
                        case 'dur':
                            n.measure.setNoteDuration(n, value);
                            ctrl.lastNoteDuration = value;
                            break;
                        // move the duration by an increment
                        case 'durInc':
                            n.measure.setNoteDuration(n, n.dur + value);
                            break;
                        case 'string':
                            n.measure.setNoteString(n, n.string + value);
                            break;
                    }
                });
            };
            
            ctrl.deleteNote = function(note) {
                note.measure.deleteNote(note);
            };

            ctrl.play = function () {
                soundService.play();
                ctrl.isPlaying = true;
            };

            ctrl.stop = function () {
                soundService.stop();
            };

            soundService.onended = function () {
                console.log('song play ended.');
                ctrl.isPlaying = false;
                $scope.$apply(); // needed to propagate the change
            };

            ctrl.togglePlay = function () {
                if (ctrl.isPlaying) {
                    ctrl.stop();
                } else {
                    ctrl.play();
                }
            };

            ctrl.toggleEdit = function () {
                if (!ctrl.editSong) {
                    ctrl.stop();
                } else {
                    ctrl.unselectMeasure();
                    ctrl.unselectNote();
                    ctrl.setReferenceMeasure(null);
                }
                ctrl.editSong = !ctrl.editSong;
            };

            ctrl.openSaveSongDialog = function () {
                $uibModal.open({
                    templateUrl: 'partials/dialogs/save-song-dialog.html',
                    controller: 'SaveSongCtrl',
                    controllerAs: 'ctrl',
                    size: 'lg',
                    resolve: {
                        songInstance: soundService.song
                    }
                });
            };

            ctrl.openSongPropertiesDialog = function () {
                $uibModal.open({
                    templateUrl: 'partials/dialogs/song-properties-dialog.html',
                    controller: 'SongPropsCtrl',
                    controllerAs: 'ctrl',
                    size: 'lg',
                    resolve: {
                        songInstance: soundService.song
                    }
                });
            };
            
            ctrl.openConfirmDialog = function (title, message, callback) {
                $uibModal.open({
                    templateUrl: 'partials/dialogs/confirm-dialog.html',
                    controller: 'ConfirmCtrl',
                    controllerAs: 'ctrl',
                    size: 'sm',
                    resolve: {
                        title: function() { return title; },
                        message: function() { return message; },
                        callback: function() { return callback; }
                    }
                });
            };

            ctrl.newSong = function () {
                ctrl.openConfirmDialog(
                    'New Song',
                    'Are you sure you want lose any changes to this song and load a new one?',
                    function () {
                        soundService.song = new Song({
                            beatCount: 4,
                            beatType: 4,
                            frets: 12,
                            strings: 6,
                            subdivisions: 2,
                            measures: [{}]
                        });

                        ctrl.song = soundService.song;

                        ctrl.openSongPropertiesDialog();
                    });
            };
            
            ctrl.openLoadSongDialog = function () {
                
                var callback = function(json) {
                    console.log('callback');
                    soundService.loadSongJson(json);
                    ctrl.song = soundService.song;
                };
                
                $uibModal.open({
                    templateUrl: 'partials/dialogs/load-dialog.html',
                    controller: 'LoadSongCtrl',
                    controllerAs: 'ctrl',
                    size: 'lg',
                    resolve: {
                        callback: function() { return callback; }
                    }
                });
            };

        }]});
