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
        ctrl.tick = ctrl.selectedRulerTick.tick;
        console.log(ctrl.tick);
        ctrl.setAvailableStrings();
        
        if (ctrl.linked) {
          ctrl.position();
        }
      };
      
      ctrl.position = function () {
        var ch = $(ctrl.element.children()[0]),
          el = ctrl.selectedRulerTick.element,
          height = el[0].getBBox().height;
          console.log(el[0]);
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

      ctrl.insertAfter = function() {
        ctrl.tabulater.insertMeasure('after');
        ctrl.updatePos();
      };

      ctrl.insertBefore = function() {
        ctrl.tabulater.insertMeasure('before');
        ctrl.updatePos();
      };
      
      ctrl.pasteAfter = function() {
        ctrl.tabulater.pasteMeasure('after');
        ctrl.updatePos();
      };

      ctrl.pasteBefore = function() {
        ctrl.tabulater.pasteMeasure('before');
        ctrl.updatePos();
      };
      
      ctrl.hasReference = function() {
          ctrl.tabulater.referenceMeasure !== null;
      };
      
      ctrl.copyMeasure = function() {
          ctrl.tabulater.setReferenceMeasure(ctrl.measure);
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
    },
    bindToController: {
      selectedRulerTick: '<',
      close: '&',
      insertMeasure: '&'
    },
    controllerAs: '$ctrl'
  };
  
}]);

