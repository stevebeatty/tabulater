'use strict';

angular.module('tabApp').controller('LoadSongCtrl', ['$scope', '$uibModalInstance',
   'callback', function($scope, $uibModalInstance, callback) {
    
    var ctrl = this;
    
    ctrl.ok = function () {
        $uibModalInstance.dismiss('ok');
        callback();
    };
    
    ctrl.error = '';
    ctrl.setError = function (err) {
        ctrl.error = err;
        console.log('error: ' + err);
        $scope.$apply();
    };
    
    ctrl.loadFile = function(file) {
        var reader = new FileReader();
        reader.onload = function (loadEvent) {
            var text = loadEvent.target.result;
            
            try {
                var json = angular.fromJson(text);
                ctrl.setError('');
                callback(json);
                $uibModalInstance.close('loaded');
            } catch (e) {
                ctrl.setError('Error parsing file');
            }
        };
        reader.onerror = function (errorEvent) {
             ctrl.setError('Error reading file');
        };
        
        try {
            reader.readAsText(file);
        } catch (e) {
            ctrl.setError('Error loading file');
        }
    };
    
    ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

}]);