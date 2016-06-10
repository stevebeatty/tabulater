describe('Song', function() {
    
    beforeEach(module('tabApp'));
    
    var Song;
    
    beforeEach(inject(function(_Song_) {
        Song = _Song_;
    }));
    
    var song;
    
    beforeEach(function() {
        song = new Song({
            beatType: 4,
            beatCount: 4,
            subdivisions: 4,
            measures: [
                {
                    content: [
                        {"pos": 1, "dur": 0.5, "string": 1, "fret": 0},
                        {"pos": 2, "dur": 0.5, "string": 1, "fret": 3},
                        {"pos": 1.5, "dur": 1, "string": 2, "fret": 3},
                        {"pos": 1.5, "dur": 0.25, "string": 1, "fret": 3}
                    ]
                },
                {
                    content: [
                        {"pos": 1, "dur": 0.5, "string": 4, "fret": 0},
                        {"pos": 1.5, "dur": 0.5, "string": 5, "fret": 3},
                        {"pos": 2.5, "dur": 1, "string": 6, "fret": 3},
                        {"pos": 3.5, "dur": 0.25, "string": 4, "fret": 3}
                    ]
                },
                {
                    content: [
                        {"pos": 1, "dur": 0.5, "string": 1, "fret": 0},
                        {"pos": 3, "dur": 0.5, "string": 1, "fret": 5},
                        {"pos": 2.5, "dur": 1, "string": 2, "fret": 6},
                        {"pos": 1.5, "dur": 0.25, "string": 1, "fret": 3}
                    ]
                }
            ]
        });
    });
    
    describe('constructor', function() {
       
       it('should parse the argument object beatType', function() {
           expect(song.getBeatType()).toBe(4);
       });
       
       it('should parse the argument object beatCount', function() {
           expect(song.getBeatCount()).toBe(4);
       });
       
       it('should parse the argument object content', function() {
           expect(song.measures).toBeDefined();
           expect(song.measures.length).toBe(3);
       });
      
    });
    
    describe('deleteMeasure', function() {
        it('should delete the argument measure', function() {
            song.deleteMeasure(song.measures[1])
            expect(song.measures.length).toBe(2);
        });
        
        it('should delete a measure not in the song', function() {
            song.deleteMeasure({})
            expect(song.measures.length).toBe(3);
        });
    });
});