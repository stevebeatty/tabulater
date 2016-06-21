'use strict';

angular.module('tabApp').directive('measureEditPanel', ['$timeout', function ($timeout) {
  function MeasureCtrl() {
      var ctrl = this;

      ctrl.linked = false;

      ctrl.subdivisionOptions = [{label: '1', value: 1}, {label: '\u00bd', value: 2},
            {label: '\u00bc', value: 4}];

      ctrl.availableSubdivisions = ctrl.subdivisionOptions; 

      ctrl.$onInit = function() {
        console.log('init measure edit panel');
      };

      ctrl.$onChanges = function(changes) {
        //console.log('changes: ' + JSON.stringify(changes));
        ctrl.measure = ctrl.selectedMeasure.measure;
        console.log('prev: ' + ctrl.measure.prevMeasure + ' next: ' + ctrl.measure.nextMeasure);
        ctrl.setAvailableSubdivisions();
        if (ctrl.linked) {
          ctrl.position();
        }
      };
      
      ctrl.position = function () {
        var ch = $(ctrl.element.children()[0]),
          el = ctrl.selectedMeasure.element,
          height = el[0].getBBox().height;
          console.log(el[0]);
        ch.position({
          my: 'left top',
          at: 'left bottom+' + (height),
          of: el,
          collision: 'fit'
        });
      };

      ctrl.setAvailableSubdivisions = function() {
          var min = ctrl.measure.minSubdivision(),
              subdur = ctrl.measure.getSubdivisions();
          
          ctrl.availableSubdivisions = ctrl.subdivisionOptions.filter(function (e) {
              if (e.value === subdur) {
                  ctrl.subdivision = e;
              }
              return min <= e.value;
          });
      };
      
      ctrl.setMeasureSubdivisions = function() {
          ctrl.measure.setSubdivisions(ctrl.subdivision.value);
      };

      ctrl.updatePos = function() {
          $timeout(function() {
              ctrl.position();
          }, 0, false);
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
      
      ctrl.deleteMeasure = function() {
          ctrl.tabulater.deleteSelectedMeasure();
      };
      
      ctrl.close = function() {
          ctrl.tabulater.unselectMeasure();
      };
    }
  
  return {
    templateUrl: 'partials/components/measure-edit-panel.html',
    controller: MeasureCtrl,
    require: {
        tabulater: '^tabulater'
    },
    link: function(scope, element, attrs) {
      scope.$ctrl.element = element;
      scope.$ctrl.linked = true;
      scope.$ctrl.position();
    },
    bindToController: {
      selectedMeasure: '<',
      close: '&',
      insertMeasure: '&'
    },
    controllerAs: '$ctrl'
  };
  
}]);

