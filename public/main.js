'use strict';

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {
    $rootScope.transitioned = false;
    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

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
app.config(function ($stateProvider) {
    $stateProvider.state('docs', {
        url: '/docs',
        templateUrl: 'js/docs/docs.html'
    });
});

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeController',
        resolve: {
            transitioned: function transitioned() {
                return false;
            }
        }
    });
});

app.controller('HomeController', function ($scope, $rootScope, $timeout) {

    $scope.slides = [1, 2, 3];
    $scope.showLogos = false;
    $scope.spotlightOn = false;
    $scope.transitioned = $rootScope.transitioned;
    $scope.curSongPlaying = false;
    $scope.activeSongIndex = 0;
    $scope.audio = document.createElement('audio');
    $scope.singles = [{ class: 'propSingle', source: 'Propuesta_Encantadora.mp3', number: 1 }, { class: 'imaginaSingle', source: 'Imaginate.mp3', number: 2 }, { class: 'dimeSingle', source: 'Dimelo_Ma.mp3', number: 3 }];

    $scope.toggleLogos = function () {
        this.showLogos = !this.showLogos;
    };

    $scope.toggleTransition = function () {
        this.transitioned = true;
        $rootScope.transitioned = true;
    };

    function randomImage() {
        var rand = Math.random();
        if (rand < .5) {
            return 1;
        } else return 2;
    };
    $scope.random = randomImage();

    $scope.obSpotLight = function () {
        var bioBanner = angular.element(document.querySelector(".bioBanner"));
        if (!$scope.spotlightOn) {
            bioBanner.css({ "background-image": "url('obHover.jpg')", "opacity": "1" });
            $scope.spotlightOn = true;
        } else {
            bioBanner.css({ "background-image": "url('noHover.jpg')", "opacity": ".5" });
            $scope.spotlightOn = false;
        }
    };

    $scope.daveSpotLight = function () {
        var bioBanner = angular.element(document.querySelector(".bioBanner"));
        if (!$scope.spotlightOn) {
            bioBanner.css({ "background-image": "url('daveHover.jpg')", "opacity": "1" });
            $scope.spotlightOn = true;
        } else {
            bioBanner.css({ "background-image": "url('noHover.jpg')", "opacity": ".5" });
            $scope.spotlightOn = false;
        }
    };

    $scope.$watch('$viewContentLoaded', function () {
        // do something
        setTimeout(function () {
            document.querySelectorAll('.land')[0].classList.add('landOn');
        }, 500);
    });

    $timeout(function () {
        twttr.widgets.load();
        FB.XFBML.parse();
    }, 30);

    $scope.pauseBroadcast = function (num) {
        $scope.$broadcast('songPause', num);
    };

    $scope.$on('pauseOnLeave', function () {
        $scope.audio.pause();
    });
});

app.controller('SinglePlayerCtrl', function ($scope, $rootScope) {
    $scope.curSongPlaying = false;
    $scope.idx = 0;

    $scope.$on('songPause', function (event, num) {
        if (num !== $scope.idx) $scope.curSongPlaying = false;
    });

    $scope.toggle = function (source, num) {
        // console.log("Reached the toggle", $scope.idx);
        if (this.curSongPlaying) {
            $scope.audio.pause();
            this.curSongPlaying = false;
        } else {
            $scope.audio.pause();
            $scope.audio.src = source;
            $scope.audio.play();
            $scope.pauseBroadcast(num);
            this.curSongPlaying = true;
        }
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('landing', {
        url: '/landing',
        templateUrl: 'js/landing/landing.html',
        controller: 'LandingController'
    });
});

app.controller('LandingController', function ($scope) {});

app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
        controller: function controller($scope, SecretStash) {
            SecretStash.getStash().then(function (stash) {
                $scope.stash = stash;
            });
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.factory('SecretStash', function ($http) {

    var getStash = function getStash() {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };
});
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
    console.log(angular.element(document.querySelector('#phead')));
});
app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('PlayerFactory', function () {
    var audio = document.createElement('audio');
    return {

        play: function play(src) {
            audio.pause();
            audio.src = src;
            audio.play();
        },

        pause: function pause() {
            audio.pause();
        }

    };
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.', 'Gimme 3 mins... I just grabbed this really dope frittata', 'If Cooper could offer only one piece of advice, it would be to nevSQUIRREL!'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

app.directive('footer', function () {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/footer/footer.html',
        link: function link() {}
    };
});
app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});

app.directive('blackwhiteLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/ob-bwLogo.html'
    };
});

app.directive('milliondollarLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/md-Logo.html'
    };
});

app.directive('appleLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/apple-logo.html'
    };
});

app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'Dave', state: 'dave' }, { label: 'O.B', state: 'ob' }, { label: 'Contact', state: 'docs' }, { label: 'Members Only', state: 'membersOnly', auth: true }];

            scope.user = null;
            scope.isCollapsed = true;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.pause = function () {
                scope.$broadcast('songPause', num);
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            scope.propogatePause = function () {
                $rootScope.$broadcast('pauseOnLeave');
            };

            setUser();
            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsYW5kaW5nL2xhbmRpbmcuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJvYkJpby9vYkJpby5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUGxheWVyRmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZm9vdGVyL2Zvb3Rlci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsIm90aGVyd2lzZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsInJ1biIsIiRyb290U2NvcGUiLCJBdXRoU2VydmljZSIsIiRzdGF0ZSIsInRyYW5zaXRpb25lZCIsImRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgiLCJzdGF0ZSIsImRhdGEiLCJhdXRoZW50aWNhdGUiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImlzQXV0aGVudGljYXRlZCIsInByZXZlbnREZWZhdWx0IiwiZ2V0TG9nZ2VkSW5Vc2VyIiwidGhlbiIsInVzZXIiLCJnbyIsIm5hbWUiLCIkc3RhdGVQcm92aWRlciIsInVybCIsImNvbnRyb2xsZXIiLCJ0ZW1wbGF0ZVVybCIsIiRzY29wZSIsIkZ1bGxzdGFja1BpY3MiLCJpbWFnZXMiLCJfIiwic2h1ZmZsZSIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0Iiwic3RhdHVzIiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsInB1c2giLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJpZCIsImZyb21TZXJ2ZXIiLCJjYXRjaCIsImxvZ2luIiwiY3JlZGVudGlhbHMiLCJwb3N0IiwibWVzc2FnZSIsImxvZ291dCIsImRlc3Ryb3kiLCJzZWxmIiwic2Vzc2lvbklkIiwicmVzb2x2ZSIsIiR0aW1lb3V0Iiwic2xpZGVzIiwic2hvd0xvZ29zIiwic3BvdGxpZ2h0T24iLCJjdXJTb25nUGxheWluZyIsImFjdGl2ZVNvbmdJbmRleCIsImF1ZGlvIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwic2luZ2xlcyIsImNsYXNzIiwic291cmNlIiwibnVtYmVyIiwidG9nZ2xlTG9nb3MiLCJ0b2dnbGVUcmFuc2l0aW9uIiwicmFuZG9tSW1hZ2UiLCJyYW5kIiwiTWF0aCIsInJhbmRvbSIsIm9iU3BvdExpZ2h0IiwiYmlvQmFubmVyIiwiZWxlbWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJjc3MiLCJkYXZlU3BvdExpZ2h0IiwiJHdhdGNoIiwic2V0VGltZW91dCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJjbGFzc0xpc3QiLCJhZGQiLCJ0d3R0ciIsIndpZGdldHMiLCJsb2FkIiwiRkIiLCJYRkJNTCIsInBhcnNlIiwicGF1c2VCcm9hZGNhc3QiLCJudW0iLCJwYXVzZSIsImlkeCIsInRvZ2dsZSIsInNyYyIsInBsYXkiLCJlcnJvciIsInNlbmRMb2dpbiIsImxvZ2luSW5mbyIsInRlbXBsYXRlIiwiU2VjcmV0U3Rhc2giLCJnZXRTdGFzaCIsInN0YXNoIiwiY29uc29sZSIsImxvZyIsImdldFJhbmRvbUZyb21BcnJheSIsImFyciIsImZsb29yIiwibGVuZ3RoIiwiZ3JlZXRpbmdzIiwiZ2V0UmFuZG9tR3JlZXRpbmciLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibGluayIsIml0ZW1zIiwibGFiZWwiLCJhdXRoIiwiaXNDb2xsYXBzZWQiLCJpc0xvZ2dlZEluIiwic2V0VXNlciIsInJlbW92ZVVzZXIiLCJwcm9wb2dhdGVQYXVzZSIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBOztBQUVBRixJQUFBRyxNQUFBLENBQUEsVUFBQUMsa0JBQUEsRUFBQUMsaUJBQUEsRUFBQTtBQUNBO0FBQ0FBLHNCQUFBQyxTQUFBLENBQUEsSUFBQTtBQUNBO0FBQ0FGLHVCQUFBRyxTQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0FILHVCQUFBSSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0FULGVBQUFVLFFBQUEsQ0FBQUMsTUFBQTtBQUNBLEtBRkE7QUFHQSxDQVRBOztBQVdBO0FBQ0FWLElBQUFXLEdBQUEsQ0FBQSxVQUFBQyxVQUFBLEVBQUFDLFdBQUEsRUFBQUMsTUFBQSxFQUFBO0FBQ0FGLGVBQUFHLFlBQUEsR0FBQSxLQUFBO0FBQ0E7QUFDQSxRQUFBQywrQkFBQSxTQUFBQSw0QkFBQSxDQUFBQyxLQUFBLEVBQUE7QUFDQSxlQUFBQSxNQUFBQyxJQUFBLElBQUFELE1BQUFD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QSxFQUFBLFVBQUFZLGVBQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0FYLGtCQUFBLEdBREE7QUFFQTFHLHFCQUFBLHlEQUZBO0FBR0E0RyxjQUFBLGNBQUFELEtBQUEsRUFBQTtBQUNBQSxrQkFBQVcsUUFBQSxHQUFBRCxnQkFBQWIsaUJBQUEsRUFBQTtBQUNBO0FBTEEsS0FBQTtBQVFBLENBVkEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZSddKTtcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHVybFJvdXRlclByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgIC8vIFRyaWdnZXIgcGFnZSByZWZyZXNoIHdoZW4gYWNjZXNzaW5nIGFuIE9BdXRoIHJvdXRlXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgIH0pO1xufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcbiAgICAkcm9vdFNjb3BlLnRyYW5zaXRpb25lZD0gZmFsc2U7XG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2RhdmUnLCB7XG4gICAgICAgIHVybDogJy9kYXZlJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Fib3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWJvdXQvYWJvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBYm91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBGdWxsc3RhY2tQaWNzKSB7XG5cbiAgICAvLyBJbWFnZXMgb2YgYmVhdXRpZnVsIEZ1bGxzdGFjayBwZW9wbGUuXG4gICAgJHNjb3BlLmltYWdlcyA9IF8uc2h1ZmZsZShGdWxsc3RhY2tQaWNzKTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdHRyYW5zaXRpb25lZDogZnVuY3Rpb24oKXtcbiAgICAgICAgXHRcdHJldHVybiBmYWxzZTtcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsJHJvb3RTY29wZSwgJHRpbWVvdXQpe1xuXG5cdCRzY29wZS5zbGlkZXM9IFsxLDIsM107XG5cdCRzY29wZS5zaG93TG9nb3M9IGZhbHNlO1xuXHQkc2NvcGUuc3BvdGxpZ2h0T249IGZhbHNlO1xuXHQkc2NvcGUudHJhbnNpdGlvbmVkPSRyb290U2NvcGUudHJhbnNpdGlvbmVkO1xuXHQkc2NvcGUuY3VyU29uZ1BsYXlpbmc9IGZhbHNlO1xuXHQkc2NvcGUuYWN0aXZlU29uZ0luZGV4PSAwOyBcblx0JHNjb3BlLmF1ZGlvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcblx0JHNjb3BlLnNpbmdsZXM9IFtcblx0e2NsYXNzOiAncHJvcFNpbmdsZScsIHNvdXJjZTogJ1Byb3B1ZXN0YV9FbmNhbnRhZG9yYS5tcDMnLCBudW1iZXI6IDF9LFxuXHR7Y2xhc3M6ICdpbWFnaW5hU2luZ2xlJywgc291cmNlOiAnSW1hZ2luYXRlLm1wMycsIG51bWJlcjogMn0sXG5cdHtjbGFzczogJ2RpbWVTaW5nbGUnLCBzb3VyY2U6ICdEaW1lbG9fTWEubXAzJywgbnVtYmVyOiAzfSBcblx0XTsgXG5cblx0JHNjb3BlLnRvZ2dsZUxvZ29zPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMuc2hvd0xvZ29zPSAhdGhpcy5zaG93TG9nb3M7XG5cdH1cblxuXHQkc2NvcGUudG9nZ2xlVHJhbnNpdGlvbj0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLnRyYW5zaXRpb25lZD10cnVlO1xuXHRcdCRyb290U2NvcGUudHJhbnNpdGlvbmVkPXRydWU7XG5cdH1cblxuXHRmdW5jdGlvbiByYW5kb21JbWFnZSgpe1xuXHRcdHZhciByYW5kPSBNYXRoLnJhbmRvbSgpO1xuXHRcdGlmKHJhbmQgPCAuNSApe1xuXHRcdFx0cmV0dXJuIDE7XG5cdFx0fVxuXHRcdGVsc2UgcmV0dXJuIDI7XG5cdH07XG5cdCRzY29wZS5yYW5kb209IHJhbmRvbUltYWdlKCk7XG5cblxuXHQkc2NvcGUub2JTcG90TGlnaHQ9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGJpb0Jhbm5lcj0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYmlvQmFubmVyXCIpKTtcblx0XHRpZighJHNjb3BlLnNwb3RsaWdodE9uKSB7XG5cdFx0XHRiaW9CYW5uZXIuY3NzKHtcImJhY2tncm91bmQtaW1hZ2VcIjogXCJ1cmwoJ29iSG92ZXIuanBnJylcIiwgXCJvcGFjaXR5XCI6IFwiMVwifSlcblx0XHRcdCRzY29wZS5zcG90bGlnaHRPbj0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRiaW9CYW5uZXIuY3NzKHtcImJhY2tncm91bmQtaW1hZ2VcIjogXCJ1cmwoJ25vSG92ZXIuanBnJylcIiwgXCJvcGFjaXR5XCI6IFwiLjVcIn0pXG5cdFx0XHQkc2NvcGUuc3BvdGxpZ2h0T249IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdCRzY29wZS5kYXZlU3BvdExpZ2h0PSBmdW5jdGlvbigpe1xuXHRcdHZhciBiaW9CYW5uZXI9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmJpb0Jhbm5lclwiKSk7XG5cdFx0aWYoISRzY29wZS5zcG90bGlnaHRPbikge1xuXHRcdFx0YmlvQmFubmVyLmNzcyh7XCJiYWNrZ3JvdW5kLWltYWdlXCI6IFwidXJsKCdkYXZlSG92ZXIuanBnJylcIiwgXCJvcGFjaXR5XCI6IFwiMVwifSlcblx0XHRcdCRzY29wZS5zcG90bGlnaHRPbj0gdHJ1ZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRiaW9CYW5uZXIuY3NzKHtcImJhY2tncm91bmQtaW1hZ2VcIjogXCJ1cmwoJ25vSG92ZXIuanBnJylcIiwgXCJvcGFjaXR5XCI6IFwiLjVcIn0pXG5cdFx0XHQkc2NvcGUuc3BvdGxpZ2h0T249IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cblx0JHNjb3BlLiR3YXRjaCgnJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oKXtcblx0ICAgLy8gZG8gc29tZXRoaW5nXG5cdCAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0ICAgXHQgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxhbmQnKVswXS5jbGFzc0xpc3QuYWRkKCdsYW5kT24nKTtcblx0ICAgXHR9LCA1MDApXG5cdCBcdH0pO1xuXG5cdCR0aW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIHR3dHRyLndpZGdldHMubG9hZCgpO1xuXHQgICAgICBcdCBGQi5YRkJNTC5wYXJzZSgpO1xuXHQgICAgICAgIH0sIDMwKTtcblxuXHQkc2NvcGUucGF1c2VCcm9hZGNhc3Q9IGZ1bmN0aW9uKG51bSl7XG5cdFx0JHNjb3BlLiRicm9hZGNhc3QoJ3NvbmdQYXVzZScsIG51bSlcblx0fVxuXG5cdCRzY29wZS4kb24oJ3BhdXNlT25MZWF2ZScsIGZ1bmN0aW9uKCl7XG5cdFx0JHNjb3BlLmF1ZGlvLnBhdXNlKCk7XG5cdH0pO1xuXG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2luZ2xlUGxheWVyQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSl7XG5cdCRzY29wZS5jdXJTb25nUGxheWluZz0gZmFsc2U7IFxuXHQkc2NvcGUuaWR4PSAwOyBcblxuXHQkc2NvcGUuJG9uKCdzb25nUGF1c2UnLCBmdW5jdGlvbihldmVudCwgbnVtKXtcblx0XHRpZihudW0hPT0gJHNjb3BlLmlkeClcblx0XHQkc2NvcGUuY3VyU29uZ1BsYXlpbmc9ZmFsc2U7XG5cdH0pO1xuXG5cdCRzY29wZS50b2dnbGU9IGZ1bmN0aW9uKHNvdXJjZSwgbnVtKXtcblx0XHQvLyBjb25zb2xlLmxvZyhcIlJlYWNoZWQgdGhlIHRvZ2dsZVwiLCAkc2NvcGUuaWR4KTtcblx0XHRpZih0aGlzLmN1clNvbmdQbGF5aW5nKXtcblx0XHRcdCRzY29wZS5hdWRpby5wYXVzZSgpO1xuXHRcdFx0dGhpcy5jdXJTb25nUGxheWluZz1mYWxzZTtcblx0XHR9XG5cdFx0ZWxzZXtcblx0XHRcdCRzY29wZS5hdWRpby5wYXVzZSgpO1xuXHRcdFx0JHNjb3BlLmF1ZGlvLnNyYz0gc291cmNlO1xuXHRcdFx0JHNjb3BlLmF1ZGlvLnBsYXkoKTtcblx0XHRcdCRzY29wZS5wYXVzZUJyb2FkY2FzdChudW0pO1xuXHRcdFx0dGhpcy5jdXJTb25nUGxheWluZz10cnVlO1xuXHRcdH1cblx0XHRcblx0fVxuXG5cblxufSk7XG5cblxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGFuZGluZycsIHtcbiAgICAgICAgdXJsOiAnL2xhbmRpbmcnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xhbmRpbmcvbGFuZGluZy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xhbmRpbmdDb250cm9sbGVyJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMYW5kaW5nQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSl7XG5cblxuXG59KVxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdvYicsIHtcbiAgICAgICAgdXJsOiAnL29iJyxcbiAgICAgICAgY29udHJvbGxlcjogJ09iQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvb2JCaW8vb2IuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdPYkNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBGdWxsc3RhY2tQaWNzKSB7XG5cbiAgICAvLyBJbWFnZXMgb2YgYmVhdXRpZnVsIEZ1bGxzdGFjayBwZW9wbGUuXG4gICAgJHNjb3BlLmltYWdlcyA9IF8uc2h1ZmZsZShGdWxsc3RhY2tQaWNzKTtcbiAgICAvLyBjb25zb2xlLmxvZyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpZnJhbWUnKVswXSk7XG4gICBjb25zb2xlLmxvZyggYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNwaGVhZCcpKSApO1xufSk7IiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1BsYXllckZhY3RvcnknLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGF1ZGlvPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuICAgIHJldHVybiB7XG5cbiAgICAgICAgcGxheTogZnVuY3Rpb24oc3JjKXtcbiAgICAgICAgICAgIGF1ZGlvLnBhdXNlKCk7XG4gICAgICAgICAgICBhdWRpby5zcmM9IHNyYztcbiAgICAgICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXVzZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGF1ZGlvLnBhdXNlKCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZm9vdGVyJywgZnVuY3Rpb24oKXtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHNjb3BlOiB7fSxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Zvb3Rlci9mb290ZXIuaHRtbCcsXG5cdFx0bGluazogZnVuY3Rpb24oKXtcblx0XHRcdFxuXHRcdH1cblx0fVxuXHRcbn0pIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pO1xuXG5hcHAuZGlyZWN0aXZlKCdibGFja3doaXRlTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL29iLWJ3TG9nby5odG1sJ1xuICAgIH07XG59KTtcblxuYXBwLmRpcmVjdGl2ZSgnbWlsbGlvbmRvbGxhckxvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9tZC1Mb2dvLmh0bWwnXG4gICAgfTtcbn0pO1xuXG5hcHAuZGlyZWN0aXZlKCdhcHBsZUxvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9hcHBsZS1sb2dvLmh0bWwnXG4gICAgfTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdEYXZlJywgc3RhdGU6ICdkYXZlJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdPLkInLCAgc3RhdGU6ICdvYid9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdDb250YWN0Jywgc3RhdGU6ICdkb2NzJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIHNjb3BlLmlzQ29sbGFwc2VkID0gdHJ1ZTtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5wYXVzZT0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzY29wZS4kYnJvYWRjYXN0KCdzb25nUGF1c2UnLCBudW0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5wcm9wb2dhdGVQYXVzZT0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3BhdXNlT25MZWF2ZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7Il19
