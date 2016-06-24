describe('Measure', function() {
    
    beforeEach(module('tabApp'));
    
    var Measure;
    
    beforeEach(inject(function(_Measure_) {
        Measure = _Measure_;
    }));
    
    var measure;
    
    beforeEach(function() {
        measure = new Measure({
            beatType: 4,
            beatCount: 4,
            subdivisions: 8,
            content: [
                {"pos": 1, "dur": 0.5, "string": 1, "fret": 0},
                {"pos": 2, "dur": 0.5, "string": 1, "fret": 3},
                {"pos": 1.5, "dur": 1, "string": 2, "fret": 3},
                {"pos": 1.5, "dur": 0.25, "string": 1, "fret": 3}
            ]
        });
    });
    
    describe('constructor', function() {
       
       it('should parse the argument object beatType', function() {
           expect(measure.getBeatType()).toBe(4);
       });
       
       it('should parse the argument object beatCount', function() {
           expect(measure.getBeatCount()).toBe(4);
       });
       
       it('should parse the argument object content', function() {
           expect(measure.content).toBeDefined();
           expect(measure.content.length).toBe(4);
       });
       
       it('should sort the argument notes', function() {
          var lastPos = 0;
           for (var i = 0; i < measure.content.length; i++) {
               var note = measure.content[i];
               expect(note.pos >= lastPos).toBe(true);
               lastPos = note.pos;
           }
       });
      
    });
    
    describe('findPreviousNoteDistance', function() {
       
        it('has previous note distance of 0 for the first pos', function() {
          expect(measure.findPreviousNoteDistance({
              "pos": 1, "dur": 0.5, "string": 1, "fret": 0})).toBe(0);
        });
        
        it('has previous note distance of 0 for any note inside a note interval', function() {
          expect(measure.findPreviousNoteDistance({
              "pos": 1.5, "dur": 0.5, "string": 1, "fret": 0})).toBe(0);
          
          expect(measure.findPreviousNoteDistance({
              "pos": 1.5, "dur": 0.5, "string": 2, "fret": 0})).toBe(0);
          
          expect(measure.findPreviousNoteDistance({
              "pos": 2, "dur": 0.5, "string": 1, "fret": 0})).toBe(0);
        });
        
        it('has positive previous note distance for any note outside a note interval', function() {
          expect(measure.findPreviousNoteDistance({
              "pos": 3, "dur": 0.5, "string": 1, "fret": 0})).toBe(0.5);
          
          expect(measure.findPreviousNoteDistance({
              "pos": 3, "dur": 0.5, "string": 2, "fret": 0})).toBe(0.5);
          
          expect(measure.findPreviousNoteDistance({
              "pos": 2, "dur": 0.5, "string": 3, "fret": 0})).toBe(1);
          
          expect(measure.findPreviousNoteDistance({
              "pos": 4, "dur": 0.5, "string": 3, "fret": 0})).toBe(3);
        });
        
        it('should skip notes if required', function() {
            console.log('testing skip');
          expect(measure.findPreviousNoteDistance({
              "pos": 3, "dur": 0.5, "string": 1, "fret": 0}, '', measure.content)).toBe(2);
          
          expect(measure.findPreviousNoteDistance({
              "pos": 3, "dur": 0.5, "string": 1, "fret": 0}, '', [measure.content[0]])).toBe(0.5);
          
          expect(measure.findPreviousNoteDistance({
              "pos": 3, "dur": 0.5, "string": 1, "fret": 0}, '', [measure.content[1]])).toBe(0.5);
          
          expect(measure.findPreviousNoteDistance({
              "pos": 3, "dur": 0.5, "string": 1, "fret": 0}, '', [measure.content[3]])).toBe(1.25);
;
        });
      
    });
    
    describe('findNextNoteDistance', function() {
       
        it('has next note distance of note count - pos for last note', function() {
          expect(measure.findNextNoteDistance({
              "pos": 4.5, "dur": 0.5, "string": 1, "fret": 0})).toBe(0.5);
          
          expect(measure.findNextNoteDistance({
              "pos": 4, "dur": 1, "string": 1, "fret": 0})).toBe(1.0);
          
          expect(measure.findNextNoteDistance({
              "pos": 1, "dur": 1, "string": 3, "fret": 0})).toBe(4.0);
        });
        
        it('has next note distance of 0 for overlaps', function() {
          expect(measure.findNextNoteDistance({
              "pos": 1, "dur": 0.5, "string": 1, "fret": 0})).toBe(0);
          
          expect(measure.findNextNoteDistance({
              "pos": 1.5, "dur": 1, "string": 2, "fret": 0})).toBe(0);
        });
        
        it('should skip notes if required', function() {
          expect(measure.findNextNoteDistance({
              "pos": 1, "dur": 0.5, "string": 1, "fret": 0}, '' , measure.content)).toBe(4);
          
          expect(measure.findNextNoteDistance({
              "pos": 1.5, "dur": 1, "string": 2, "fret": 0}, '' , measure.content)).toBe(3.5);
          
          expect(measure.findNextNoteDistance({
              "pos": 1.25, "dur": 1, "string": 2, "fret": 0}, '' , [measure.content[2]])).toBe(3.75);
        });
        
    });
    
    describe('minSubdivision', function() {
        it('should pick the smallest duration', function() {
            expect(measure.minSubdivision()).toBe(4);
        });
        
        it('should pick the smallest offset', function() {
            var m = new Measure({
                beatType: 4,
                beatCount: 4,
                subdivisions: 4,
                content: [
                    {"pos": 1.25, "dur": 0.5, "string": 1, "fret": 0},
                    {"pos": 2, "dur": 0.5, "string": 1, "fret": 3},
                    {"pos": 1.5, "dur": 1, "string": 2, "fret": 3}
                ]
            });
            expect(m.minSubdivision()).toBe(4);
        });
    });
    
    describe('moveNotePosition', function() {

        it('should move between measures', function() {
            var measures = [new Measure({
                beatType: 4,
                beatCount: 4,
                subdivisions: 4,
                content: [
                    {"pos": 1.25, "dur": 0.5, "string": 1, "fret": 0}
                ]
            }),new Measure({
                beatType: 4,
                beatCount: 4,
                subdivisions: 4,
                content: [
                ]
            })];
        
            measures[0].nextMeasure = measures[1];
            measures[1].prevMeasure = measures[0];
            
            measures[0].moveNotePosition(measures[0].content[0], 5);
            
            expect(measures[0].content.length).toBe(0);
            expect(measures[1].content.length).toBe(1);
            expect(measures[1].content[0].pos).toBe(2.25);
            expect(measures[1].content[0].dur).toBe(0.5);
        });
        
        it('should set continued notes', function() {
            var measures = [new Measure({
                beatType: 4,
                beatCount: 4,
                subdivisions: 4,
                content: []
            }),new Measure({
                beatType: 4,
                beatCount: 4,
                subdivisions: 4,
                content: []
            })];
        
            measures[0].nextMeasure = measures[1];
            measures[1].prevMeasure = measures[0];
            
            expect(measures[0].continuedNotes.length).toBe(0);
            expect(measures[1].continuedNotes.length).toBe(0);
            
            measures[0].addNoteFromObject({"pos": 4.25, "dur": 1.0, "string": 1, "fret": 0});

            expect(measures[0].continuedNotes.length).toBe(0);
            expect(measures[1].continuedNotes.length).toBe(1);
            expect(measures[1].continuedNotes[0].note.pos).toBe(1);
            expect(measures[1].continuedNotes[0].note.dur).toBe(0.25);
            expect(measures[1].continuedNotes[0].note.string).toBe(1);
            expect(measures[1].continuedNotes[0].note.fret).toBe(0);
            expect(measures[1].continuedNotes[0].origin).toBe(measures[0].content[0]);
            
            measures[0].moveNotePosition(measures[0].content[0], 2);
            
            expect(measures[0].continuedNotes.length).toBe(0);
            expect(measures[1].continuedNotes.length).toBe(0);
            expect(measures[1].content[0].pos).toBe(2.25);
            expect(measures[1].content[0].dur).toBe(1.0);
            expect(measures[1].content[0].string).toBe(1);
            expect(measures[1].content[0].fret).toBe(0);
        });
    });
});