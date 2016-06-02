'use strict';

angular.module('tabApp').component('tabulater', {
     templateUrl: 'partials/tabulater.html',
     controllerAs: 'tabCtrl',
     controller: ['$scope', '$uibModal', 'Measure', 'Song', 'soundService',
 function ($scope, $uibModal, Measure, Song, soundService) {
    
  var ctrl = this;  
  
  soundService.initialize();
  soundService.loadSounds();
  soundService.loadSong('songs/plush.json').then( function() {
    ctrl.song = $scope.song = soundService.song;
  });
  
  ctrl.selectedMeasure = null;
  ctrl.selectedNote = null;
  
  ctrl.editSong = false;
  
  
  
  ctrl.selectMeasure = function(measure, posEl) {
      ctrl.unselectMeasure();
    ctrl.unselectNote();
      
      ctrl.selectedMeasure = { measure: measure, element: posEl};
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
  
  ctrl.selectNote = function(note, measure, position) {
      ctrl.unselectMeasure();
    ctrl.unselectNote();
    
    ctrl.selectedNote = { note: note, measure: measure, song: soundService.song,
       position: position};
      console.log('selected note: ' + JSON.stringify(note));
    note.selected = true;
  };
  
  ctrl.unselectNote = function() {
    if (ctrl.selectedNote) {
      ctrl.selectedNote.note.selected = false;
      ctrl.selectedNote = null;
    }
  };
  
  ctrl.play = function () {
    soundService.play();
    ctrl.isPlaying = true;
  };
  
  ctrl.stop = function() {
    soundService.stop();
  };
  
  soundService.onended = function() {
      console.log('song play ended.');
      ctrl.isPlaying = false;
      $scope.$apply(); // needed to propagate the change
  };
  
  ctrl.togglePlay = function() {
    if (ctrl.isPlaying) {
        ctrl.stop();
    } else {
        ctrl.play();
    }
  };
  
  ctrl.toggleEdit = function() {
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
            templateUrl: 'partials/save-song-dialog.html',
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
            templateUrl: 'partials/song-properties-dialog.html',
            controller: 'SongPropsCtrl',
            controllerAs: 'ctrl',
            size: 'lg',
            resolve: {
              songInstance: soundService.song
             }
        });
    };
    
    ctrl.newSong = function () {
        soundService.song = new Song({
           noteCount: 4,
           noteType: 4,
           frets: 12,
           strings: 6,
           subdivisions: 2,
           measures: [{}]
        });
        
        ctrl.song = soundService.song;
        
        ctrl.openSongPropertiesDialog();
    };

}]});
