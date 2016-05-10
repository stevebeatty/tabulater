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
  
  $scope.fontSize = 12;
  $scope.text = '\u2669';
  $scope.width = 0;
  
  $scope.strings = [1, 2, 3, 4, 5, 6];
  $scope.stringsTopOffset = 1.5;
  
  $scope.frets = [];
  for (var i = 0; i <= 24; i++) {
      $scope.frets.push(i);
  }
  
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
  
  $scope.clickLine = function(event, string, measure) {
    console.log('click string ' + string);
    console.log(event);
    var bound = event.target.getBoundingClientRect(), 
        x = event.clientX - bound.left,
        y = event.clientY - bound.top,
        w = x/bound.width,
        pos = $scope.closestNotePosition(measure, w),
        note = { pos: pos, string: string, fret: 10 },
        dur = noteMethods.findNextNoteDistance(measure, note),
        prevD = noteMethods.findPreviousNoteDistance(measure, note);
    
    if (dur === 0) {
      console.log('cannot place new note - currently occupied');
      return;
    }
    
    note.dur = Math.min(dur, 1);
    
    console.log("x: "+x+" y:"+y + ' ' + bound.left + ' ' + pos + ' ' + w + ' prev: ' + prevD);
    
    measure.content.push(note);
    measure.content.sort(function (a, b) {
      var d = a.pos - b.pos;
      if (d !== 0) return d;
      
      return a.string - b.string;
    });
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
  }
  
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
     
    
    $('#panel').position({
       my: 'center top',
       at: 'center bottom',
       of: event.target,
       collision: 'fit'
     });
     
     
     
    console.log('max dur: ' + noteMethods.findNextNoteDistance(measure, note) +
                ' prev d: ' + noteMethods.findPreviousNoteDistance(measure, note) +
                ' avail strs: ' + noteMethods.allMoveOptionsForNote(measure, note, $scope.strings));

    var strs = noteMethods.allMoveOptionsForNote(measure, note, $scope.strings);

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
      });
    };
}]);

tabApp.controller('NoteEditCtrl', [ '$scope', '$uibModalInstance', 'noteMethodsFactory',
  'note', 'strings', 'frets', 'measure', 
  function ($scope, $uibModalInstance, noteMethods, note, strings, frets, measure) {

  $scope.note = note;
  $scope.measure = measure;
  $scope.strings = strings;
  $scope.frets = frets;

  $scope.ok = function () {
    $uibModalInstance.close($scope.note);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
  
  $scope.setMovedNoteDuration = function() {
    var d = noteMethods.findNextNoteDistance($scope.measure, $scope.note);
    $scope.note.dur = Math.min($scope.note.dur, d);
    console.log('dist: ' + d);
  };
}]);