'use strict';

/* Tab App Module */

var tabApp = angular.module('tabApp', ['ui.bootstrap']);

tabApp.factory('noteMethodsFactory', function() {
    var fac = {};
    
    fac.addNote = function(measure, note) {
      measure.content.push(note);
      fac.sortMeasure(measure);
    }
    
    fac.deleteNote = function(measure, note) {
      var idx = measure.content.indexOf(note);
      if (idx >= 0) {
        measure.content.splice(idx, 1);
        fac.sortMeasure(measure);
      }
    }
    
    fac.sortMeasure = function(measure) {
      measure.content.sort(function (a, b) {
        var d = a.pos - b.pos;
        if (d !== 0) return d;

        return a.string - b.string;
      });
    }
    
    fac.numberSequence = function(start, end) {
      var arr = [];
      for (var i = start; i <= end; i++) {
        arr.push(i);
      }
      
      return arr;
    }
    
    fac.setStrings = function(count) {
      fac.strings = fac.numberSequence(1, count);
    }
    
    fac.setFrets = function(count) {
      fac.frets = fac.numberSequence(0, count - 1);
    }
    
    /**
     * 
     * @param {type} measure
     * @param {type} note
     * @param {type} string
     * @returns {Number}
     */
    fac.findNextNoteDistance = function(measure, note, string) {
      string = string || note.string;

      // start from left and find the first note after the pos of our note
      // that is on the same string
      for (var i = 0; i < measure.content.length; i++) {
        var n = measure.content[i];
        if (n.string !== string || n === note) {
          continue;
        }
        // once that note is found return the difference in pos
        if (n.pos > note.pos) return n.pos - note.pos; 
        // if a note overlaps our note then zero duration
        if (n.pos + n.dur > note.pos) return 0;
      }
      // no note found, so return space left in measure
      return measure.noteCount - note.pos + 1;
    };
    
    /**
     * 
     * @param {type} measure
     * @param {type} note
     * @param {type} string
     * @returns {Number}
     */
    fac.findPreviousNoteDistance = function(measure, note, string) {
      string = string || note.string;

      // start from right and find the first note before the pos of our note
      // that is on the same string 
      for (var i = measure.content.length - 1; i >= 0; i--) {
        var n = measure.content[i];
        if (n.string !== string || n === note || n.pos > note.pos) {
          continue;
        }
        // once that note is found return the distance
        return note.pos - n.pos - n.dur ;
      }
      // no note, so return distance to start of measure
      return note.pos - 1;
    };
    
    /**
     * 
     * @param {type} measure
     * @param {type} note
     * @param {type} strings
     * @returns {Array}
     */
    fac.allMoveOptionsForNote = function(measure, note, strings) {
      var blockedStrings = {};

      // start from left and find a note that has an overlapping interval
      for (var i = 0; i < measure.content.length; i++) {
        var n = measure.content[i];
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
    
    return fac;
});

