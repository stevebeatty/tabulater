'use strict';

angular.module('tabApp').controller('ConfirmCtrl', ['$uibModalInstance',
    'title', 'message', 'callback', function($uibModalInstance, title, message, callback) {
    
    var ctrl = this;
    
    ctrl.title = title;
    ctrl.message = message;

    ctrl.ok = function () {
        $uibModalInstance.dismiss('ok');
        callback();
    };
    
    ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}]);