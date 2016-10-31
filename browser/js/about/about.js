app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('dave', {
        url: '/dave',
        controller: 'AboutController',
        templateUrl: 'js/about/about.html'
    });

});

app.controller('AboutController', function ($scope, FullstackPics) {

    // Images of beautiful Fullstack people.
    $scope.images = _.shuffle(FullstackPics);

});