'use strict';

var tabApp = angular.module('tabApp');

tabApp.controller('TabViewCtrl', ['$scope', '$http', '$uibModal', '$timeout',
    'noteMethodsFactory'
  , function ($scope, $http, $uibModal, $timeout, noteMethods) {
  $scope.soundLocations = {
    '1': '1st_String_E_64kb.mp3',
    '2': '2nd_String_B__64kb.mp3',
    '3': '3rd_String_G_64kb.mp3',
    '4': '4th_String_D_64kb.mp3',
    '5': '5th_String_A_64kb.mp3',
    '6': '6th_String_E_64kb.mp3'
  };
  
  $scope.stringSounds = {};
  
  angular.forEach($scope.soundLocations, function (v, k) {
    $http.get('sound/' + v, {responseType: 'arraybuffer'}).success(function(data) {
      $scope.audioContext.decodeAudioData(data, function(decoded) {
        $scope.stringSounds[k] = decoded;
      });
    });
  });
  
  $scope.stringsTopOffset = 1.5;
  
  noteMethods.setStrings(6);
  noteMethods.setFrets(24);
  $scope.strings = noteMethods.strings;
  $scope.frets = noteMethods.frets;
  
  $scope.beatsPerMinute = 80;
  
  $scope.noteCircleRadius = 0.7;
  $scope.stringOffset = $scope.noteCircleRadius * 2;
  
  $scope.sideOffset = $scope.noteCircleRadius * 2;
  $scope.subdivisions = 4;
  $scope.subdivisionOffset = $scope.noteCircleRadius * 2.5;
  
  $scope.makeRuler = function(measure) {
    var count = measure.noteCount,
        marks = [],
        div = 1;
        
    for (var i = 1; i <= count; i++) {
      marks.push({
        pos: i,
        type: div
      });
    }
  };
  
  $scope.insertBetween = function(arr, value) {
    var size = 2*arr.length;
    for (var i = 1; i < size; i += 2) {
      arr.splice(i, 0, value);
    }
  };
  
  $scope.test = [1, 1, 1, 1];
  for (var sb = 2; sb <= $scope.subdivisions; sb *= 2) {
    $scope.insertBetween($scope.test, sb);
  }
    // 1, 8, 4, 8, 2, 8, 4, 8, 1, 8 ...
    // 1, 4, 2, 4, 1, 4, 2, 4, 1, 4 ...
    // 1, 2, 1, 2, 1, 2
    // 1, 1, 1, 1
  
  var AC = window.AudioContext || 
           window.mozAudioContext ||
           window.msAudioContext;
  $scope.audioContext = new AC();
  
  $scope.mainGain = $scope.audioContext.createGain();
  $scope.mainGain.gain.value = 1;
  $scope.mainGain.connect($scope.audioContext.destination);
  
  $scope.measureEndTime = 0;
  $scope.nextMeasure = -1;
  $scope.timeoutPromise;
  
  $scope.measures = [
    { 
      noteType: 4,
      noteCount: 4,
      content: [
          { pos: 1, string: 1, fret: 3, dur: 0.5 },
          { pos: 1, string: 2, fret: 3, dur: 0.5 },
          { pos: 1, string: 3, fret: 0, dur: 0.5 },
          { pos: 1.5, string: 1, fret: 3, dur: 1 },
          { pos: 1.5, string: 2, fret: 3, dur: 1 },
          { pos: 1.5, string: 3, fret: 0, dur: 1 },
          { pos: 2.5, string: 1, fret: 3, dur: 2.5 },
          { pos: 2.5, string: 2, fret: 2, dur: 2.5 },
          { pos: 2.5, string: 3, fret: 3, dur: 2.5 }
        ]
    },
    { 
      noteType: 4,
      noteCount: 4,
      content: [
          { pos: 1, string: 1, fret: 3, dur: 0.5 },
          { pos: 1, string: 2, fret: 1, dur: 0.5 },
          { pos: 1, string: 3, fret: 2, dur: 0.5 },
          { pos: 1.5, string: 1, fret: 3, dur: 1 },
          { pos: 1.5, string: 2, fret: 1, dur: 1 },
          { pos: 1.5, string: 3, fret: 2, dur: 1 },
          { pos: 2.5, string: 1, fret: 3, dur: 1.5 },
          { pos: 2.5, string: 2, fret: 0, dur: 1.5 },
          { pos: 2.5, string: 3, fret: 0, dur: 1.5 },
          { pos: 4, string: 1, fret: 3, dur: 0.25 },
          { pos: 4, string: 2, fret: 0, dur: 0.25 },
          { pos: 4, string: 3, fret: 0, dur: 0.25 },
          { pos: 4.25, string: 1, fret: 3, dur: 0.25 },
          { pos: 4.25, string: 2, fret: 1, dur: 0.25 },
          { pos: 4.25, string: 3, fret: 0, dur: 0.25 },
          { pos: 4.5, string: 1, fret: 3, dur: 0.5 },
          { pos: 4.5, string: 2, fret: 2, dur: 0.5 },
          { pos: 4.5, string: 3, fret: 0, dur: 0.5 }
      ]
    },{ 
      noteType: 4,
      noteCount: 4,
      content: [
          { pos: 1, string: 1, fret: 3, dur: 0.5 },
          { pos: 1, string: 2, fret: 3, dur: 0.5 },
          { pos: 1, string: 3, fret: 0, dur: 0.5 },
          { pos: 1.5, string: 1, fret: 3, dur: 1 },
          { pos: 1.5, string: 2, fret: 3, dur: 1 },
          { pos: 1.5, string: 3, fret: 0, dur: 1 },
          { pos: 2.5, string: 1, fret: 3, dur: 2.5 },
          { pos: 2.5, string: 2, fret: 2, dur: 2.5 },
          { pos: 2.5, string: 3, fret: 3, dur: 2.5 }
        ]
    },
    { 
      noteType: 4,
      noteCount: 4,
      content: [
          { pos: 1, string: 1, fret: 3, dur: 0.5 },
          { pos: 1, string: 2, fret: 1, dur: 0.5 },
          { pos: 1, string: 3, fret: 2, dur: 0.5 },
          { pos: 1.5, string: 1, fret: 3, dur: 1 },
          { pos: 1.5, string: 2, fret: 1, dur: 1 },
          { pos: 1.5, string: 3, fret: 2, dur: 1 },
          { pos: 2.5, string: 1, fret: 3, dur: 2.5 },
          { pos: 2.5, string: 2, fret: 0, dur: 2.5 },
          { pos: 2.5, string: 3, fret: 0, dur: 2.5 },
          { pos: 2.5, string: 4, fret: 0, dur: 2.5 }
      ]
    }
  ];
  noteMethods.measures = $scope.measures;
  
  $scope.clickLine = function(event, string, measure) {
    console.log('click string ' + string);
    console.log(event);
    var bound = event.target.getBoundingClientRect(), 
        x = event.clientX - bound.left,
        y = event.clientY - bound.top,
        w = x/bound.width,
        pos = $scope.closestNotePosition(measure, w),
        note = { pos: pos, string: string, fret: 0 },
        dur = noteMethods.findNextNoteDistance(measure, note),
        prevD = noteMethods.findPreviousNoteDistance(measure, note);
    
    if (dur === 0) {
      console.log('cannot place new note - currently occupied');
      return;
    }
    
    note.dur = Math.min(dur, 1);
    
    console.log("x: "+x+" y:"+y + ' ' + bound.left + ' ' + pos + ' ' + w + ' prev: ' + prevD);
    
    noteMethods.addNote(measure, note);
    
    $scope.open(event, note, measure);
  };
  
  $scope.stringYOffset = function(stringNum) {
    return $scope.stringsTopOffset + (stringNum - 1)*$scope.stringOffset;
  };
  
  $scope.noteXPosition = function (pos) {
    return $scope.sideOffset + $scope.notePositionDistance(pos, 1);
  };
  
  $scope.notePositionDistance = function (pos1, pos2) {
    return Math.abs(pos2 - pos1)*$scope.subdivisionOffset*$scope.subdivisions;
  };
  
  $scope.noteDurationDistance = function (note) {
    var dur = note.dur || 1;
    return $scope.notePositionDistance(dur, 0);
  };
  
  $scope.measureWidth = function (measure) {
    return 1.5*$scope.sideOffset + $scope.subdivisions * $scope.subdivisionOffset * measure.noteCount;
  };
  
  $scope.closestNotePosition = function(measure, xNormalized) {
    var m = $scope.measureWidth(measure), // the width in em of the measure
      xPos = Math.min(Math.max(xNormalized * m, $scope.sideOffset), m - $scope.sideOffset), // the position of the x in the measure
      pos = (xPos -$scope.sideOffset)/($scope.subdivisionOffset*$scope.subdivisions) + 1,
      //pos = Math.max(p + 1, 1),
      f = 1/$scope.subdivisions,
      frac = pos % 1,
      ti = Math.floor(frac / f),
      fr = frac === 0 ? 0 : Math.round((frac % f)/f),
      rnd = Math.floor(pos) + ti*f + fr*f,
      clm = Math.min(measure.noteCount + 1 - f, rnd);
      
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
   // osc.stop($scope.audioContext.currentTime + 1);
   $scope.createNote(400, 0, 1);
   $scope.createNote(500, 1, 2);
   $scope.createNote(700, 2, 3);
   $scope.createNote(400, 3, 4);
   $scope.createNote(500, 4, 5);
   $scope.createNote(200, 5, 6);
   $scope.createNote(400, 6, 7);
   $scope.createNote(0, 7, 8);
   $scope.createNote(200, 8, 9);
  };
  
  $scope.playMeasureNotes = function(measure, beginTime) {
    var beatDelay = 60/$scope.beatsPerMinute;
    
    measure.content.forEach(function (note) {
      var start = (note.pos - 1)*beatDelay + beginTime;
      $scope.createNote(100*note.fret, start, start + note.dur*beatDelay, note.string + '');
    });
    
    $scope.measureEndTime += beatDelay*measure.noteCount;
  };
  
  $scope.play = function () {
    //$scope.playMeasureNotes($scope.measures[0]);
    $scope.nextMeasure = 0;
    $scope.measureEndTime = $scope.audioContext.currentTime;
    $scope.playAndSchedule();
  };
  
  $scope.scheduleNextTimeout = function() {
    $timeout(function() {
      $scope.playAndSchedule();
    }, 
    100);
  };
  
  $scope.playAndSchedule = function() {
    if ($scope.nextMeasure > -1) {
      if($scope.nextMeasure < $scope.measures.length) {
        console.log('playing ' + $scope.nextMeasure);
        $scope.playMeasureNotes($scope.measures[$scope.nextMeasure], $scope.measureEndTime);
        $scope.nextMeasure += 1;
        $scope.scheduleNextTimeout();
      } else {
        $scope.nextMeasure = -1;
      }
    }
  };
  
  $scope.createNote = function (detune, start, stop, sound) {
    var src = $scope.audioContext.createBufferSource();
   src.buffer = $scope.stringSounds[sound];
   src.detune.value = detune;
   
   var gain = $scope.audioContext.createGain();
    gain.gain.value = 1;
    src.connect(gain);
   
   gain.connect($scope.mainGain);
   src.start(start);
   src.stop(stop);
  };
  
  
  $scope.open = function (event, note, measure) {
    console.log('trg: ' + event.target);
    var panel = $('#panel');
    
    panel.show();
    
    var measureEl = $(event.target).closest('.measure'),
        rulerEl = measureEl.children('.ruler'),
        pos = rulerEl.position(),
        height = rulerEl[0].getBBox().height;
    
    var diff = pos.top - $(event.target).position().top;
    
     panel.position({
       my: 'center top',
       at: 'center bottom+' + (diff + height),
       of: event.target,
       collision: 'fit'
     });
    
    console.log('parent measure: ' +  measureEl.attr('id') + ' ruler top: ' + pos.top + ' height: ' + height + ' calc top: ' + diff);
    
    console.log('max dur: ' + noteMethods.findNextNoteDistance(measure, note) +
                ' prev d: ' + noteMethods.findPreviousNoteDistance(measure, note) +
                ' avail strs: ' + noteMethods.allMoveOptionsForNote(measure, note, $scope.strings));
  
    
    
    $scope.$broadcast('NoteEdit', {note: note, measure: measure, strings: $scope.strings});
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
    
}]);

tabApp.controller('NoteEditCtrl', [ '$scope', 'noteMethodsFactory',
  
  function ($scope, noteMethods) {

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
    $scope.strings = args.strings;
    
    $scope.updateState();
  });
  
  $scope.removeSelection = function() {
    if ($scope.note) {
      delete $scope.note.selected;
    }
  };
  
  $scope.updateState = function() {
    var nextDist = noteMethods.findNextNoteDistance($scope.measure, $scope.note),
        prevDist = noteMethods.findPreviousNoteDistance($scope.measure, $scope.note);
    
    console.log('next dist ' + nextDist + ' prevDist ' + prevDist);
    
    $scope.updateMoveOptions(prevDist, nextDist);
    $scope.updateBeatOptions(nextDist);
    
    $scope.availableStrings = noteMethods.allMoveOptionsForNote($scope.measure,
      $scope.note, $scope.strings);
  };
  
  $scope.updateMoveOptions = function(prevDist, nextDist) {
    var minDur = 1/$scope.subdivisions;
    $scope.canMoveBackward = prevDist > 0;
    $scope.canMoveForward = (nextDist - minDur > 0);
  };
  
  $scope.moveNoteForward = function() {
    var minDur = 1/$scope.subdivisions,
      nextDist = noteMethods.findNextNoteDistance($scope.measure, $scope.note),
      moveIncr = Math.max(Math.min($scope.moveValue.value, nextDist - minDur), 0);
    $scope.note.pos += moveIncr;
    $scope.setMovedNoteDuration();
    $scope.updateState();
  };
  
  $scope.moveNoteBackward = function() {
    var moveIncr = $scope.moveValue.value,
        prevDist = noteMethods.findPreviousNoteDistance($scope.measure, $scope.note);
    $scope.note.pos -= Math.min(moveIncr, prevDist);
    $scope.updateState();
  };
  
  $scope.updateBeatOptions = function(nextDist) {
    var minDur = 1/$scope.subdivisions;
    $scope.canDecreaseBeats = ($scope.note.dur - minDur) > 0;
    $scope.canIncreaseBeats = (nextDist - $scope.note.dur) > 0;
  };
  
  $scope.increaseBeats = function() {
    var nextDist = noteMethods.findNextNoteDistance($scope.measure, $scope.note);
    $scope.note.dur = Math.min($scope.beatChangeValue.value + $scope.note.dur, nextDist);
    $scope.updateState();
  };
  
  $scope.decreaseBeats = function() {
    var minDur = 1/$scope.subdivisions;
    $scope.note.dur = Math.max($scope.note.dur - $scope.beatChangeValue.value, minDur);
    $scope.updateState();
  };
  
  $scope.setBeats = function() {
    var minDur = 1/$scope.subdivisions;
    $scope.note.dur = Math.max($scope.beatChangeValue.value, minDur);
    $scope.updateState();
  };
  
  $scope.setMovedNoteDuration = function() {
    var d = noteMethods.findNextNoteDistance($scope.measure, $scope.note);
    $scope.note.dur = Math.min($scope.note.dur, d);
    console.log('dist: ' + d);
  };
  
  $scope.deleteNote = function() {
    noteMethods.deleteNote($scope.measure, $scope.note);
    $scope.close();
  }
}]);