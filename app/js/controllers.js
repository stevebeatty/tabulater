'use strict';

var tabApp = angular.module('tabApp');

tabApp.controller('TabViewCtrl', ['$scope', '$http', '$uibModal', '$timeout', '$q',
    'Measure', 'Song', 'soundService'
  , function ($scope, $http, $uibModal, $timeout, $q, Measure, Song, soundService) {
    
  var ctrl = this;  
  
  soundService.initialize();
  soundService.loadSounds();
  soundService.loadSong('songs/plush.json').then( function() {
    $scope.song = soundService.song;
  });
  
  $scope.stringsTopOffset = 1.5;
  
  $scope.noteCircleRadius = 0.7;
  $scope.stringOffset = $scope.noteCircleRadius * 2;
  
  $scope.sideOffset = $scope.noteCircleRadius * 2;
  $scope.subdivisionOffset = $scope.noteCircleRadius * 2.5;
  
  ctrl.selectedMeasure = null;
  ctrl.selectedNote = null;
  
  // 1, 8, 4, 8, 2, 8, 4, 8, 1, 8 ...
    // 1, 4, 2, 4, 1, 4, 2, 4, 1, 4 ...
    // 1, 2, 1, 2, 1, 2
    // 1, 1, 1, 1
  $scope.rulers = {};
  
  $scope.insertBetween = function(arr, value) {
    var size = 2*arr.length;
    for (var i = 1; i < size; i += 2) {
      arr.splice(i, 0, value);
    }
  };
  
 // console.log(angular.toJson($scope.song));
  
  $scope.clickLine = function(event, string, measure) {
    console.log('click string ' + string);
    console.log(event);
    var bound = event.target.getBoundingClientRect(), 
        x = event.clientX - bound.left,
        y = event.clientY - bound.top,
        w = x/bound.width,
        pos = $scope.closestNotePosition(measure, w),
        note = { pos: pos, string: string, fret: 0 },
        dur = measure.findNextNoteDistance(note),
        prevD = measure.findPreviousNoteDistance(note);
    
    if (dur === 0) {
      console.log('cannot place new note - currently occupied');
      return;
    }
    
    note.dur = Math.min(dur, 1);
    
    console.log("x: "+x+" y:"+y + ' ' + bound.left + ' ' + pos + ' ' + w + ' prev: ' + prevD);
    
    var n = measure.addNoteFromObject(note);
    
    ctrl.clickNote(event, n, measure);
  };
  
  $scope.clickMeasure = function(event, measure) {
    console.log('click measure');
    
    var measureEl = $(event.target).closest('.measure'),
        rulerEl = measureEl.children('.ruler');
    
    ctrl.selectedMeasure = { measure: measure, element: rulerEl};
  };
  
  ctrl.unselectMeasure = function () {
    console.log('unselect measure');
    ctrl.selectedMeasure = null;
  };
  
  ctrl.insertMeasure = function (where) {
    if (where === 'before') {
      soundService.song.insertMeasureBefore(ctrl.selectedMeasure.measure, new Measure());
    } else {
      soundService.song.insertMeasureAfter(ctrl.selectedMeasure.measure, new Measure());
    }
    
    ctrl.unselectMeasure();
  };
  
  ctrl.clickNote = function(event, note, measure) {
    var measureEl = $(event.target).closest('.measure'),
        rulerEl = measureEl.children('.ruler')[0];
    var el = $(event.target)[0],
          bound = el.getBoundingClientRect(),
          pos = { x: (bound.left + bound.width/2) ,
                  y: rulerEl.getBoundingClientRect().bottom };
    
    ctrl.unselectNote();
    
    ctrl.selectedNote = { note: note, measure: measure, song: soundService.song,
        element: event.target, position: pos};
      
    note.selected = true;
 
    //$scope.open(event, note, measure);
  };
  
  ctrl.unselectNote = function() {
    if (ctrl.selectedNote) {
      ctrl.selectedNote.note.selected = false;
      ctrl.selectedNote = null;
    }
  };
  
  $scope.stringYOffset = function(stringNum) {
    return $scope.stringsTopOffset + (stringNum - 1)*$scope.stringOffset;
  };
  
  $scope.topStringYOffset = function() {
    return $scope.stringYOffset(1);
  };
  
  $scope.bottomStringYOffset = function() {
    return $scope.stringYOffset(soundService.song.strings.length);
  };
  
  $scope.noteXPosition = function (measure, pos) {
    return $scope.sideOffset + $scope.notePositionDistance(measure, pos, 1);
  };
  
  $scope.rulerTickXPosition = function(measure, index) {
    return $scope.noteXPosition(measure, 1 + index/measure.getSubdivisions());  
  };
  
  $scope.rulerBottom = function () {
    return $scope.stringYOffset(soundService.song.strings.length + 1);
  };
  
  $scope.getRuler = function(measure) {
      return $scope.findOrCreateRuler(measure.getNoteCount(), measure.getSubdivisions());
  };
  
  $scope.findOrCreateRuler = function(beatCount, subdivision) {
      var index = beatCount + '/' + subdivision;
      
      if (index in this.rulers) return this.rulers[index];
      else {
          var r;
          if (subdivision === 1) {
              r = new Array(beatCount).fill(1);
          } else {
              r = $scope.findOrCreateRuler(beatCount, subdivision/2);
              $scope.insertBetween(r, subdivision);
          }
          
          this.rulers[index] = r;
          return r;
      }
  };
  
  $scope.notePositionDistance = function (measure, pos1, pos2) {
    return Math.abs(pos2 - pos1)*$scope.subdivisionOffset*measure.getSubdivisions();
  };
  
  $scope.noteDurationDistance = function (measure, note) {
    var dur = note.dur || 1;
    return $scope.notePositionDistance(measure, dur, 0);
  };
  
  $scope.measureWidth = function (measure) {
    return 1.5*$scope.sideOffset + measure.getSubdivisions() * $scope.subdivisionOffset * measure.getNoteCount();
  };
  
  $scope.closestNotePosition = function(measure, xNormalized) {
    var m = $scope.measureWidth(measure), // the width in em of the measure
      xPos = Math.min(Math.max(xNormalized * m, $scope.sideOffset), m - $scope.sideOffset), // the position of the x in the measure
      pos = (xPos -$scope.sideOffset)/($scope.subdivisionOffset*measure.getSubdivisions()) + 1,
      //pos = Math.max(p + 1, 1),
      f = 1/measure.getSubdivisions(),
      frac = pos % 1,
      ti = Math.floor(frac / f),
      fr = frac === 0 ? 0 : Math.round((frac % f)/f),
      rnd = Math.floor(pos) + ti*f + fr*f,
      clm = Math.min(measure.getNoteCount() + 1 - f, rnd);
      
      console.log('pos ' + pos + ' ' + frac + ' ' + ti + ' ' + fr + ' r ' + clm);
      
      return clm;
  };
  
  $scope.playSound = function () {
   // var osc = $scope.audioContext.createOscillator();
    //osc.frequency.value = 329.63;
    //var gain = $scope.audioContext.createGain();
    //gain.gain.value = 1;
    //osc.connect(gain);
    //osc.connect($scope.audioContext.destination);

    // Start immediately, and stop in 2 seconds.
   // osc.start();
   // osc.stop(soundService.audioContext.currentTime + 1);
   /*
   $scope.createNote(400, 0, 1);
   $scope.createNote(500, 1, 2);
   $scope.createNote(700, 2, 3);
   $scope.createNote(400, 3, 4);
   $scope.createNote(500, 4, 5);
   $scope.createNote(200, 5, 6);
   $scope.createNote(400, 6, 7);
   $scope.createNote(0, 7, 8);
   $scope.createNote(200, 8, 9);
    */
  };
  
  $scope.play = function () {
    //$scope.playMeasureNotes($scope.measures[0]);
    /*$scope.nextMeasure = 0;
    $scope.measureEndTime = soundService.audioContext.currentTime;
    $scope.playAndSchedule();*/
    soundService.play();
  };
  
  $scope.open = function (event, note, measure) {
    console.log('trg: ' + event.target);
    var panel = $('#panel');
    
    panel.show();
    
    var measureEl = $(event.target).closest('.measure'),
        rulerEl = measureEl.children('.ruler'),
        pos = rulerEl.position(),
        height = rulerEl[0].getBBox().height;
    
    var targetPos = $(event.target).position();
    var diff = pos.top - (targetPos.top);
    
     panel.position({
       my: 'center top',
       at: 'center bottom+' + (diff + height),
       of: event.target,
       collision: 'fit'
     });
    
    console.log('parent measure: ' +  measureEl.attr('id') + ' ruler top: ' + pos.top + ' height: ' + height + ' calc top: ' + diff);
    
    $scope.$broadcast('NoteEdit', {note: note, measure: measure, song: soundService.song});
/*
    var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'myModalContent.html',
      controller: 'NoteEditCtrl',
      size: 'sm',
      resolve: {
        note: note,
        strings: function() {
            return strs;
        },
        frets: function() {
            return $scope.frets;
        },
        measure: function() {
          return measure;
        }
       }
      }); */
      
    }; 
    
  $scope.openMeasurePanel = function (event, measure) {
    console.log('trg: ' + event.target);
    var panel = $('#measure-panel');
    
    panel.show();
    
    var measureEl = $(event.target).closest('.measure'),
        rulerEl = measureEl.children('.ruler'),
        pos = rulerEl.position(),
        height = rulerEl[0].getBBox().height;
    
    var diff = pos.top - $(event.target).position().top;
    
     panel.position({
       my: 'left top',
       at: 'left bottom+' + (height),
       of: rulerEl,
       collision: 'fit'
     });
    
    console.log('parent measure: ' +  measureEl.attr('id') + ' ruler top: ' + pos.top + ' height: ' + height + ' calc top: ' + diff);
    
    $scope.$broadcast('MeasureEdit', {measure: measure, song: soundService.song});
      
    };   
    
}]);

tabApp.controller('NoteEditCtrl', [ '$scope', 
  
  function ($scope) {

  $scope.beatChangeType = '=';
  $scope.beatChangeOptions = ['=', '+', '-'];
  $scope.beatChangeAmounts = [{label: '1', value: 1}, {label: '\u00bd', value: 0.5}, 
    {label: '\u00bc', value: 0.25}];
  $scope.beatChangeValue = $scope.beatChangeAmounts[0];
  
  $scope.moveValue = $scope.beatChangeAmounts[0];
  $scope.canMoveForward = false;
  $scope.canMoveBackward = false;
  
  $scope.canIncreaseBeats = false;
  $scope.canDecreaseBeats = false;
  $scope.canSetBeats = false;
  
  $scope.close = function() {
    $('#panel').hide();
    $scope.removeSelection();
  };
  
  $scope.$on('NoteEdit', function(event, args) {
    console.log('noteedit');
  
    $scope.removeSelection();
    
    $scope.note = args.note;
    $scope.note.selected = true;
    $scope.measure = args.measure;
    $scope.song = args.song;
    
    $scope.updateState();
  });
  
  $scope.removeSelection = function() {
    if ($scope.note) {
      delete $scope.note.selected;
    }
  };
  
  $scope.updateState = function() {
    var nextDist = $scope.measure.findNextNoteDistance($scope.note),
        prevDist = $scope.measure.findPreviousNoteDistance($scope.note);
    
    console.log('next dist ' + nextDist + ' prevDist ' + prevDist);
    
    $scope.updateMoveOptions(prevDist, nextDist);
    $scope.updateBeatOptions(nextDist);
    
    $scope.availableStrings = $scope.measure.allStringOptionsForNote(
      $scope.note, $scope.song.strings);
  };
  
  $scope.updateMoveOptions = function(prevDist, nextDist) {
    var minDur = 1/$scope.measure.getSubdivisions();
    $scope.canMoveBackward = prevDist > 0;
    $scope.canMoveForward = (nextDist - minDur > 0);
  };
  
  $scope.moveNoteForward = function() {
    var minDur = 1/$scope.measure.getSubdivisions(),
      nextDist = $scope.measure.findNextNoteDistance($scope.note),
      moveIncr = Math.max(Math.min($scope.moveValue.value, nextDist - minDur), 0);
    $scope.note.pos += moveIncr;
    $scope.setMovedNoteDuration();
    $scope.updateState();
  };
  
  $scope.moveNoteBackward = function() {
    var moveIncr = $scope.moveValue.value,
        prevDist = $scope.measure.findPreviousNoteDistance($scope.note);
    $scope.note.pos -= Math.min(moveIncr, prevDist);
    $scope.updateState();
  };

  $scope.updateBeatOptions = function(nextDist) {
    var minDur = 1/$scope.measure.getSubdivisions();
    $scope.canDecreaseBeats = ($scope.note.dur - minDur) > 0;
    $scope.canIncreaseBeats = (nextDist - $scope.note.dur) > 0;
  };
  
  $scope.increaseBeats = function() {
    var nextDist = $scope.measure.findNextNoteDistance($scope.note);
    $scope.note.dur = Math.min($scope.beatChangeValue.value + $scope.note.dur, nextDist);
    $scope.updateState();
  };
  
  $scope.decreaseBeats = function() {
    var minDur = 1/$scope.measure.getSubdivisions();
    $scope.note.dur = Math.max($scope.note.dur - $scope.beatChangeValue.value, minDur);
    $scope.updateState();
  };
  
  $scope.setBeats = function() {
    var minDur = 1/$scope.measure.getSubdivisions();
    $scope.note.dur = Math.max($scope.beatChangeValue.value, minDur);
    $scope.updateState();
  };
  
  $scope.setMovedNoteDuration = function() {
    var d = $scope.measure.findNextNoteDistance($scope.note);
    $scope.note.dur = Math.min($scope.note.dur, d);
    console.log('dist: ' + d);
  };
  
  $scope.deleteNote = function() {
    $scope.measure.deleteNote($scope.note);
    $scope.close();
  };
}]);


tabApp.controller('MeasureEditCtrl', [ '$scope', 'Measure',
  
  function ($scope, Measure) {

  $scope.beatChangeType = '=';
  $scope.beatChangeOptions = ['=', '+', '-'];
  $scope.beatChangeAmounts = [{label: '1', value: 1}, {label: '\u00bd', value: 0.5}, 
    {label: '\u00bc', value: 0.25}];
  $scope.beatChangeValue = $scope.beatChangeAmounts[0];
  
  $scope.moveValue = $scope.beatChangeAmounts[0];
  $scope.canMoveForward = false;
  $scope.canMoveBackward = false;
  
  $scope.canIncreaseBeats = false;
  $scope.canDecreaseBeats = false;
  $scope.canSetBeats = false;
  
  $scope.close = function() {
    $('#measure-panel').hide();
    $scope.removeSelection();
  };
  
  $scope.removeSelection = function() {
    if ($scope.measure) {
      delete $scope.measure.selected;
    }
  };
  
  $scope.$on('MeasureEdit', function(event, args) {
    console.log('measure edit');
  
    $scope.removeSelection();
    
    $scope.measure = args.measure;
    $scope.measure.selected = true;
    $scope.song = args.song;
  });
  
  $scope.insertNewBefore = function() {
    $scope.song.insertMeasureBefore($scope.measure, new Measure());
    $scope.close();
  };
  
  $scope.insertNewAfter = function() {
    $scope.song.insertMeasureAfter($scope.measure, new Measure());
    $scope.close();
  };
}]);

tabApp.directive('measureEditPanel', function () {
  function MeasureCtrl() {
      var ctrl = this;

      ctrl.linked = false;

      ctrl.$onInit = function() {
        console.log('init measure edit panel');
      };

      ctrl.$onChanges = function(changes) {
        console.log('changes: ' + JSON.stringify(changes));
        
        if (ctrl.linked) {
          ctrl.position();
        }
      };
      
      ctrl.position = function () {
        var ch = $(ctrl.element.children()[0]),
          el = ctrl.selectedMeasure.element,
          height = el[0].getBBox().height;
    
  
        ch.position({
          my: 'left top',
          at: 'left bottom+' + (height),
          of: el,
          collision: 'fit'
        });
      };

      ctrl.insertAfter = function() {
        ctrl.insertMeasure({where: 'after'});
      };

      ctrl.insertBefore = function() {
        ctrl.insertMeasure({where: 'before'});
      };
    }
  
  return {
    templateUrl: 'partials/measure-edit.html',
    controller: MeasureCtrl,
    link: function(scope, element, attrs) {
      scope.$ctrl.element = element;
      scope.$ctrl.linked = true;
      scope.$ctrl.position();
    },
    bindToController: {
      selectedMeasure: '<',
      close: '&',
      insertMeasure: '&'
    },
    controllerAs: '$ctrl'
  };
  
});

tabApp.directive('noteEditPanel', function () {
  function NoteEditCtrl() {
      var ctrl = this;

      ctrl.linked = false;

      ctrl.beatChangeType = '=';
        ctrl.beatChangeOptions = ['=', '+', '-'];
        ctrl.beatChangeAmounts = [{label: '1', value: 1}, {label: '\u00bd', value: 0.5}, 
          {label: '\u00bc', value: 0.25}];
        ctrl.beatChangeValue = ctrl.beatChangeAmounts[0];
        ctrl.moveValue = ctrl.beatChangeAmounts[0];

      ctrl.$onInit = function() {
        console.log('init note edit panel');
      };

      ctrl.$onChanges = function(changes) {
        console.log('changes: ' + JSON.stringify(changes));
        ctrl.note = ctrl.selectedNote.note;
        ctrl.measure = ctrl.selectedNote.measure;
        ctrl.song = ctrl.selectedNote.song;
        
        ctrl.updateState();
        
        if (ctrl.linked) {
          ctrl.position();
        }
      };
      
      ctrl.updateState = function() {
        var nextDist = ctrl.measure.findNextNoteDistance(ctrl.note),
            prevDist = ctrl.measure.findPreviousNoteDistance(ctrl.note);

        console.log('next dist ' + nextDist + ' prevDist ' + prevDist);

        ctrl.updateMoveOptions(prevDist, nextDist);
        ctrl.updateBeatOptions(nextDist);

        ctrl.availableStrings = ctrl.measure.allStringOptionsForNote(
          ctrl.note, ctrl.song.strings);
      };
      
      ctrl.updateMoveOptions = function(prevDist, nextDist) {
        var minDur = 1/ctrl.measure.getSubdivisions();
        ctrl.canMoveBackward = prevDist > 0;
        ctrl.canMoveForward = (nextDist - minDur > 0);
      };
      
      ctrl.updateBeatOptions = function(nextDist) {
        var minDur = 1/ctrl.measure.getSubdivisions();
        ctrl.canDecreaseBeats = (ctrl.note.dur - minDur) > 0;
        ctrl.canIncreaseBeats = (nextDist - ctrl.note.dur) > 0;
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
        
        var i = 0;
      };
    }
  
  return {
    templateUrl: 'partials/note-edit.html',
    controller: NoteEditCtrl,
    link: function(scope, element, attrs) {
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