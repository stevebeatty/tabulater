'use strict';

angular.module('tabApp').directive('rulerTickEditPanel', ['$timeout', function ($timeout) {
  function RulerTickCtrl() {
      var ctrl = this;

      ctrl.linked = false;
      ctrl.availableStrings = [];

      ctrl.$onInit = function() {
        console.log('init tick edit panel');
      };

      ctrl.$onChanges = function(changes) {
        //console.log('changes: ' + JSON.stringify(changes));
        
        if (!ctrl.selectedRulerTick) return;
        
        ctrl.tick = ctrl.selectedRulerTick.tick;
        //console.log(ctrl.tick);
        ctrl.setAvailableStrings();
        
        if (ctrl.linked) {
          ctrl.position();
        }
      };
      
      ctrl.position = function () {
        var ch = $(ctrl.element.children()[0]),
          el = ctrl.selectedRulerTick.element,
          height = el[0].getBBox().height;
         // console.log(el[0]);
        ch.position({
          my: 'center top',
          at: 'center bottom+' + (height),
          of: el,
          collision: 'fit'
        });
      };

      ctrl.updatePos = function() {
          $timeout(function() {
              ctrl.position();
          }, 0, false);
      };
      
      ctrl.setAvailableStrings = function() {
          var pos = ctrl.selectedRulerTick.tick.pos,
              measure = ctrl.selectedRulerTick.measure,
              note = {pos: pos, dur: 1/measure.getSubdivisions(), string: 0},
              strings = measure.allStringOptionsForNote(note);
          
          console.log(strings);
          ctrl.availableStrings = strings;
      };

      ctrl.pasteNotes = function() {
        ctrl.tabulater.pasteNotes(ctrl.selectedRulerTick.tick.pos, ctrl.selectedRulerTick.measure);
      };
      
      ctrl.canPaste = function() {
          if (ctrl.referenceNotes.length === 0) return false;
          return ctrl.referenceNotes.every(function(el) {
              var i = ctrl.availableStrings.indexOf(el.note.string);
              //console.log(el.note.string + ' ' + i + ' ' + ctrl.availableStrings);
              return i >= 0;
          });
      };

      ctrl.selectNotesAtTick = function() {
          var notes = ctrl.selectedRulerTick.measure.findNotesAtPos(ctrl.selectedRulerTick.tick.pos);
          
          if (notes.length === 0) return;
          console.log(ctrl.selectedRulerTick.element);
          var el = ctrl.selectedRulerTick.element[0],
              bound = el.getBoundingClientRect(),
              pos = {x: (bound.left + bound.width / 2),
                    y: bound.bottom};
                
            ctrl.tabulater.selectNotes(notes, pos);
      };
      
      ctrl.close = function() {
          ctrl.tabulater.unselectRulerTick();
      };
    }
  
  return {
    templateUrl: 'partials/components/ruler-tick-edit-panel.html',
    controller: RulerTickCtrl,
    require: {
        tabulater: '^tabulater'
    },
    link: function(scope, element, attrs) {
      scope.$ctrl.element = element;
      scope.$ctrl.linked = true;
      scope.$ctrl.position();
      
      scope.$watchCollection('$ctrl.referenceNotes', function(newValues, oldValues) {
            console.log('watching ref.');
            
        });
    },
    bindToController: {
      selectedRulerTick: '<',
      referenceNotes: '<',
      close: '&',
      insertMeasure: '&'
    },
    controllerAs: '$ctrl'
  };
  
}]);

