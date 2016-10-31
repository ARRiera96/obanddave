app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('ob', {
        url: '/ob',
        controller: 'ObController',
        templateUrl: 'js/obBio/ob.html'
    });

});

app.controller('ObController', function ($scope, FullstackPics) {

    // Images of beautiful Fullstack people.
    $scope.images = _.shuffle(FullstackPics);
    // console.log(document.querySelectorAll('iframe')[0]);
   console.log( angular.element(document.querySelector('#phead')) );
});