'use strict';

angular.module('tabApp').controller('SaveSongCtrl', ['$uibModalInstance',
    'songInstance', function($uibModalInstance, songInstance) {
    
    var ctrl = this;
    
    ctrl.song = songInstance;
    ctrl.songJson = angular.toJson(ctrl.song);
    
    ctrl.ok = function () {
        $uibModalInstance.dismiss('ok');
    };
    
}]);