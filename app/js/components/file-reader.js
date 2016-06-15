'use strict';

angular.module('tabApp').directive('fileReader', function() {
return {
        scope: {
            fileReader: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                scope.fileReader(changeEvent.target.files[0]);
            });
        }
    };
});