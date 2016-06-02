'use strict';

/* Tab App Module */

var tabApp = angular.module('tabApp', ['ui.bootstrap']);

tabApp.factory('Note', function() {
  
  function Note(obj) {
    if (angular.isObject(obj)) {
      this.pos = obj.pos;
      this.dur = obj.dur;
      this.string = obj.string;
      this.fret = obj.fret;
    }
  }
  
  Note.prototype.toJSON = function () {
    return {
      pos: this.pos,
      dur: this.dur,
      string: this.string,
      fret: this.fret
    };
  };
  
  return Note;
  
}).factory('Measure', ['Note', function(Note) {
  
  function Measure(obj) {
    this.content = [];
    
    if (angular.isObject(obj)) {
      this.noteType = obj.noteType;
      this.noteCount = obj.noteCount;
      
      if (angular.isArray(obj.content)) {
        for (var i = 0; i < obj.content.length; i++) {
          this.content.push(new Note(obj.content[i]));
        }
      }
      this.sortMeasure();
    }
  }
  
  Measure.prototype.sortMeasure = function() {
    this.content.sort(function (a, b) {
      var d = a.pos - b.pos;
      if (d !== 0) return d;

      return a.string - b.string;
    });
  };
  
  Measure.prototype.addNoteFromObject = function(note) {
    var n = new Note(note);
    this.content.push(n);
    this.sortMeasure();
    return n;
  };

  Measure.prototype.deleteNote = function(note) {
    var idx = this.content.indexOf(note);
    if (idx >= 0) {
      this.content.splice(idx, 1);
      this.sortMeasure();
    }
  };
  
  Measure.prototype.getSubdivisions = function() {
    return this.subdivisions || this.song.subdivisions;
  };
  
  Measure.prototype.getNoteCount = function() {
    return this.noteCount || this.song.noteCount;
  };
  
  Measure.prototype.getNoteType = function() {
    return this.noteType || this.song.noteType;
  };
  
    /**
     * 
     * @param {type} note
     * @param {type} string
     * @returns {Number}
     */
    Measure.prototype.findPreviousNoteDistance = function(note, string) {
      string = string || note.string;

      // start from right and find the first note before the pos of our note
      // that is on the same string 
      for (var i = this.content.length - 1; i >= 0; i--) {
        var n = this.content[i];
        if (n.string !== string || n === note || n.pos > note.pos) {
          continue;
        }
        // once that note is found return the distance
        var dist = note.pos - n.pos - n.dur ;
        return (dist < 0) ? 0 : dist;
      }
      // no note, so return distance to start of measure
      return note.pos - 1;
    };
  
  /**
   * 
   * @param {type} note
   * @param {type} string
   * @returns {Number}
   */
  Measure.prototype.findNextNoteDistance = function(note, string) {
    string = string || note.string;

    // start from left and find the first note after the pos of our note
    // that is on the same string
    for (var i = 0; i < this.content.length; i++) {
      var n = this.content[i];
      if (n.string !== string || n === note) {
        continue;
      }
      // once that note is found return the difference in pos
      if (n.pos > note.pos) return n.pos - note.pos; 
      // if a note overlaps our note then zero duration
      if (n.pos + n.dur > note.pos) return 0;
    }
    // no note found, so return space left in measure
    return this.getNoteCount() - note.pos + 1;
  };
  
    /**
     * 
     * @param {type} note
     * @param {type} strings
     * @returns {Array}
     */
  Measure.prototype.allStringOptionsForNote = function(note, strings) {
    var blockedStrings = {};

    // start from left and find a note that has an overlapping interval
    for (var i = 0; i < this.content.length; i++) {
      var n = this.content[i];
      // continue if the note.pos is outside another note's interval
      // occurring at the end of interval is ok, but not at the beginning
      if (n.string === note.string || note.pos >= n.pos + n.dur || note.pos < n.pos) {
        continue;
      }

      // if not it's blocked
      blockedStrings[n.string] = true;
    }

    // include the ones that aren't blocked
    var availStrings = [];
    for (var j = 0; j < strings.length; j++) {
      var str = strings[j];
      if (!blockedStrings.hasOwnProperty(str)) {
        availStrings.push(str);
      }
    }

    return availStrings;
  };
  
  Measure.prototype.minSubdivision = function() {
    var minDur = 1/this.song.subdivision;
    
    this.content.forEach(function (e) {
       if (e.dur < minDur) {
           minDur = e.dur;
       } 
    });
    
    return Math.round(1/minDur);
  };
  
  Measure.prototype.toJSON = function () {
    return {
      noteType: this.noteType,
      noteCount: this.noteCount,
      content: this.content
    };
  };
  
  return Measure;
  
}]).factory('Song', ['Measure', function(Measure) {
  
  function Song(obj) {
    this.measures = [];
    
    if (angular.isObject(obj)) {
      this.subdivisions = obj.subdivisions || 1;
      this.tempo = obj.tempo || 120;
      this.name = obj.name;
      this.by = obj.by;
      
      if (angular.isNumber(obj.frets)) {
        this.setFrets(obj.frets);
      }
      
      if (angular.isNumber(obj.strings)) {
        this.setStrings(obj.strings);
      }
      
      this.noteCount = obj.noteCount;
      this.noteType = obj.noteType;
      
      if (angular.isArray(obj.measures)) {
        for (var i = 0; i < obj.measures.length; i++) {
          this.measures.push(new Measure(obj.measures[i]));
          this.measures[i].song = this;
        }
      }
    } else {
      this.strings = [];
      this.frets = [];
    }
  }
  
  Song.prototype.insertMeasureBefore = function(measure, toInsert) {
    console.log('inserting');
    var idx = this.measures.indexOf(measure);
    idx = idx < 0 ? 0 : idx;
    this.measures.splice(idx, 0, toInsert);
    this.linkMeasure(toInsert);
  };
  
  Song.prototype.insertMeasureAfter = function(measure, toInsert) {
    var idx = this.measures.indexOf(measure) + 1;
    this.measures.splice(idx, 0, toInsert);
    this.linkMeasure(toInsert);
  };
  
  Song.prototype.linkMeasure = function(measure) {
      measure.song = this;
  };
  
  Song.prototype.numberSequence = function(start, end) {
    var arr = [];
    for (var i = start; i <= end; i++) {
      arr.push(i);
    }

    return arr;
  };

  Song.prototype.setStrings = function(count) {
    this.strings = this.numberSequence(1, count);
  };

  Song.prototype.setFrets = function(count) {
    this.frets = this.numberSequence(0, count);
  };
  
  Song.prototype.toJSON = function () {
    return {
        name: this.name,
        by: this.by,
      subdivisions: this.subdivisions,
      tempo: this.tempo,
      noteType: this.noteType,
      noteCount: this.noteCount,
      measures: this.measures,
      strings: this.strings[this.strings.length - 1],
      frets: this.frets[this.frets.length - 1]
    };
  };
  
  return Song;
  
}]).service('soundService', ['$http', '$q', '$timeout', 'Song', 
                     function($http, $q, $timeout, Song) {
  var self = this; 
  var AC = window.AudioContext || 
           window.mozAudioContext ||
           window.msAudioContext;
       
  this.audioContext = new AC();
  
  this.soundsPrefix = 'sound/';

  this.soundMap = {
    1: [{begin: 0, end: 12, file: '1st_String_E_64kb.mp3'}],
    2: [{begin: 0, end: 12, file: '2nd_String_B__64kb.mp3'}],
    3: [{begin: 0, end: 12, file: '3rd_String_G_64kb.mp3'}],
    4: [{begin: 0, end: 12, file: '4th_String_D_64kb.mp3'}],
    5: [{begin: 0, end: 12, file: '5th_String_A_64kb.mp3'}],
    6: [{begin: 0, end: 12, file: '6th_String_E_64kb.mp3'}]
  };
   
  this.sounds = {};
   
  this.initialize = function () {
    self.mainGain = self.audioContext.createGain();
    self.mainGain.gain.value = 1;
    self.mainGain.connect(self.audioContext.destination);
    
    self.measureEndTime = 0;
    self.measureStartTime = 0;
    self.nextMeasure = -1;
    
    self.soundId = 1;
    self.currentSounds = {};
  };
  
  this.loadSounds = function() {
    var allAsync = [], loadingFiles = {};
  
    angular.forEach(self.soundMap, function (v, k) {
      angular.forEach(v, function(interval) {
        var file = interval.file;
        if (!(file in loadingFiles)) {
          loadingFiles[file] = true;
          var promise = $http.get(self.soundsPrefix + file, 
                {responseType: 'arraybuffer'}).then(function(response) {
              console.log('retrieved ' + file );
              self.audioContext.decodeAudioData(response.data, function(decoded) {
              self.sounds[file] = decoded;
            });
          });
          allAsync.push(promise);
        }
      }); 
    });
  
    return $q.all(allAsync);
  };
  
  this.loadSong = function(songPath) {
    return $http.get(songPath, {responseType: 'json'}).then(function(response) {
      console.log('retrieved song ' + songPath );
      self.song = new Song(angular.fromJson(response.data));
    });
  };
  
  this.findSound = function(string, fret) {
    var intervals = self.soundMap[string] || [];
    for (var i = 0; i < intervals.length; i++) {
      var interval = intervals[i];
      if (fret >= interval.begin && fret <= interval.end) {
        return interval.file;
      }
    }
  };
  
  this.createBufferNode = function (sound, detune, start, stop) {
    var src = self.audioContext.createBufferSource();
    src.buffer = sound;
    src.detune.value = detune;

    var gain = self.audioContext.createGain();
    gain.gain.value = 1;
    src.connect(gain);

    gain.connect(self.mainGain);
    src.start(start);
    src.stop(stop);
    
    var soundId = this.soundId;
    src.onended = function() {
        console.log('ended id ' + soundId);
        delete self.currentSounds[soundId];
        
        var keys = Object.keys(self.currentSounds);
        console.log(keys + ' nextmeasure ' + self.nextMeasure);
        if (keys.length === 0 && self.nextMeasure === -1) {
            self.onended();
        }
    };
    
    this.currentSounds[soundId] = src;
    
    this.soundId++;
  };
  
  this.playNote = function (string, fret, startTime, stopTime) {
    var file = self.findSound(string, fret),
        buffer = self.sounds[file];
    
    self.createBufferNode(buffer, fret*100, startTime, stopTime);
  };
  
  
  
  this.playMeasureNotes = function(measure, beginTime) {
    var beatDelay = 60/self.song.tempo;
    
    measure.content.forEach(function (note) {
      var start = (note.pos - 1)*beatDelay + beginTime;
      //$scope.createNote(100*note.fret, start, start + note.dur*beatDelay, note.string + '');
      self.playNote(note.string, note.fret, start, start + note.dur*beatDelay);
    });
    
    self.measureStartTime = beginTime;
    self.measureEndTime += beatDelay*measure.getNoteCount();
    console.log('end time is: ' + self.measureEndTime + ' start time is: ' + self.measureStartTime);
  };
  
  this.play = function () {
    self.nextMeasure = 0;
    self.measureStartTime = self.measureEndTime = self.audioContext.currentTime;
    self.playAndSchedule();
  };
  
  this.isPlaying = function() {
      return self.nextMeasure > -1 || Object.keys(self.currentSounds).length > 0;
  };
  
  this.onended = function() {
      console.log('all play as ended');
  };
  
  this.stop = function() {
      angular.forEach(self.currentSounds, function (value, key) {
          value.stop();
      });
      self.nextMeasure = -1;
  };
  
  function timerFunc() {
      if (self.audioContext.currentTime > (self.measureStartTime + 
              0.8*(self.measureEndTime - self.measureStartTime))) {
        self.playAndSchedule();
      }
      console.log('current time is: ' + self.audioContext.currentTime);
      if(self.nextMeasure > -1 && self.nextMeasure < self.song.measures.length) {
        self.scheduleNextTimeout();
      } else {
          self.nextMeasure = -1;
      }
    }
  
  this.scheduleNextTimeout = function() {
    $timeout(timerFunc, 100);
  };
  
  this.playAndSchedule = function() {
    if (self.nextMeasure > -1) {
      if(self.nextMeasure < self.song.measures.length) {
        console.log('playing ' + self.nextMeasure);
        self.playMeasureNotes(self.song.measures[self.nextMeasure], self.measureEndTime);
        self.nextMeasure += 1;
        self.scheduleNextTimeout();
      } else {
        self.nextMeasure = -1;
      }
    }
  };

}]);

