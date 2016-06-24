'use strict';

angular.module('tabApp').factory('Note', function () {

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
    
    Note.prototype.toString = function () {
        return JSON.stringify(this);
    };

    return Note;

});