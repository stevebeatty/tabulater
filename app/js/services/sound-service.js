'use strict';

angular.module('tabApp')
    .service('soundService', ['$http', '$q', '$timeout', 'Song',
        function ($http, $q, $timeout, Song) {
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

            this.loadSounds = function () {
                var allAsync = [], loadingFiles = {};

                angular.forEach(self.soundMap, function (v, k) {
                    angular.forEach(v, function (interval) {
                        var file = interval.file;
                        if (!(file in loadingFiles)) {
                            loadingFiles[file] = true;
                            var promise = $http.get(self.soundsPrefix + file,
                                {responseType: 'arraybuffer'}).then(function (response) {
                                console.log('retrieved ' + file);
                                self.audioContext.decodeAudioData(response.data, function (decoded) {
                                    self.sounds[file] = decoded;
                                });
                            });
                            allAsync.push(promise);
                        }
                    });
                });

                return $q.all(allAsync);
            };

            this.loadSong = function (songPath) {
                return $http.get(songPath, {responseType: 'json'}).then(function (response) {
                    console.log('retrieved song ' + songPath);
                    self.song = new Song(angular.fromJson(response.data));
                });
            };

            this.findSound = function (string, fret) {
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
                src.onended = function () {
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

                self.createBufferNode(buffer, fret * 100, startTime, stopTime);
            };



            this.playMeasureNotes = function (measure, beginTime) {
                var beatDelay = 60 / self.song.tempo;

                measure.content.forEach(function (note) {
                    var start = (note.pos - 1) * beatDelay + beginTime;
                    self.playNote(note.string, note.fret, start, start + note.dur * beatDelay);
                });

                self.measureStartTime = beginTime;
                self.measureEndTime += beatDelay * measure.getBeatCount();
                console.log('end time is: ' + self.measureEndTime + ' start time is: ' + self.measureStartTime);
            };

            this.play = function () {
                self.nextMeasure = 0;
                self.measureStartTime = self.measureEndTime = self.audioContext.currentTime;
                self.playAndSchedule();
            };

            this.isPlaying = function () {
                return self.nextMeasure > -1 || Object.keys(self.currentSounds).length > 0;
            };

            this.onended = function () {
                console.log('all play as ended');
            };

            this.stop = function () {
                angular.forEach(self.currentSounds, function (value, key) {
                    value.stop();
                });
                self.nextMeasure = -1;
            };

            function timerFunc() {
                if (self.audioContext.currentTime > (self.measureStartTime +
                    0.8 * (self.measureEndTime - self.measureStartTime))) {
                    self.playAndSchedule();
                }
                console.log('current time is: ' + self.audioContext.currentTime);
                if (self.nextMeasure > -1 && self.nextMeasure < self.song.measures.length) {
                    self.scheduleNextTimeout();
                } else {
                    self.nextMeasure = -1;
                }
            }

            this.scheduleNextTimeout = function () {
                $timeout(timerFunc, 100);
            };

            this.playAndSchedule = function () {
                if (self.nextMeasure > -1) {
                    if (self.nextMeasure < self.song.measures.length) {
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