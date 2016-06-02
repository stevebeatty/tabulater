'use strict';

angular.module('tabApp').controller('SongPropsCtrl', ['$uibModalInstance',
    'songInstance', function($uibModalInstance, songInstance) {
    
    var ctrl = this;
    
    ctrl.song = songInstance;
    
    ctrl.ok = function () {
        $uibModalInstance.dismiss('ok');
    };
}]);