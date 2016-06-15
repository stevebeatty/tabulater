'use strict';

angular.module('tabApp').component('tabulater', {
    templateUrl: 'partials/components/tabulater.html',
    controllerAs: 'tabCtrl',
    controller: ['$scope', '$uibModal', 'Measure', 'Song', 'soundService',
        function ($scope, $uibModal, Measure, Song, soundService) {

            var ctrl = this;

            soundService.initialize();
            soundService.loadSounds();
            soundService.loadSong('songs/plush.json').then(function () {
                ctrl.song = soundService.song;
            });

            ctrl.selectedMeasure = null;
            ctrl.selectedNote = null;

            ctrl.editSong = false;
            
            ctrl.lastNoteDuration = 1;

            ctrl.selectMeasure = function (measure, posEl) {
                ctrl.unselectMeasure();
                ctrl.unselectNote();

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

            ctrl.insertMeasure = function (where) {
                if (where === 'before') {
                    soundService.song.insertMeasureBefore(ctrl.selectedMeasure.measure, new Measure());
                } else {
                    soundService.song.insertMeasureAfter(ctrl.selectedMeasure.measure, new Measure());
                }

                ctrl.unselectMeasure();
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

            ctrl.selectNote = function (note, measure, position) {
                ctrl.unselectMeasure();
                ctrl.unselectNote();

                ctrl.selectedNote = {note: note, measure: measure, song: soundService.song,
                    position: position};
                console.log('selected note: ' + JSON.stringify(note));
                note.selected = true;
            };

            ctrl.unselectNote = function () {
                if (ctrl.selectedNote) {
                    ctrl.selectedNote.note.selected = false;
                    ctrl.selectedNote = null;
                }
            };
            
            ctrl.updateNote = function(note, field, value) {
                var measure = note.measure;
                console.log('update note: ' + note + ' field ' + field + ' value ' + value);
                
                switch (field) {
                    case 'string':
                        measure.setNoteString(note, value);
                        break;
                    case 'dur':
                        measure.setNoteDuration(note, value);
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
