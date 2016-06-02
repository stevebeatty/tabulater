'use strict';

angular.module('tabApp').directive('measureEditPanel', function () {
  function MeasureCtrl() {
      var ctrl = this;

      ctrl.linked = false;

      ctrl.$onInit = function() {
        console.log('init measure edit panel');
      };

      ctrl.$onChanges = function(changes) {
        console.log('changes: ' + JSON.stringify(changes));
        
        if (ctrl.linked) {
          ctrl.position();
        }
      };
      
      ctrl.position = function () {
        var ch = $(ctrl.element.children()[0]),
          el = ctrl.selectedMeasure.element,
          height = el[0].getBBox().height;
    
  
        ch.position({
          my: 'left top',
          at: 'left bottom+' + (height),
          of: el,
          collision: 'fit'
        });
      };

      ctrl.insertAfter = function() {
        ctrl.insertMeasure({where: 'after'});
      };

      ctrl.insertBefore = function() {
        ctrl.insertMeasure({where: 'before'});
      };
    }
  
  return {
    templateUrl: 'partials/measure-edit-panel.html',
    controller: MeasureCtrl,
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
  
});

