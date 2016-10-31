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

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsYW5kaW5nL2xhbmRpbmcuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJvYkJpby9vYkJpby5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUGxheWVyRmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZm9vdGVyL2Zvb3Rlci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsIm90aGVyd2lzZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsInJ1biIsIiRyb290U2NvcGUiLCJBdXRoU2VydmljZSIsIiRzdGF0ZSIsInRyYW5zaXRpb25lZCIsImRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgiLCJzdGF0ZSIsImRhdGEiLCJhdXRoZW50aWNhdGUiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImlzQXV0aGVudGljYXRlZCIsInByZXZlbnREZWZhdWx0IiwiZ2V0TG9nZ2VkSW5Vc2VyIiwidGhlbiIsInVzZXIiLCJnbyIsIm5hbWUiLCIkc3RhdGVQcm92aWRlciIsInVybCIsImNvbnRyb2xsZXIiLCJ0ZW1wbGF0ZVVybCIsIiRzY29wZSIsIkZ1bGxzdGFja1BpY3MiLCJpbWFnZXMiLCJfIiwic2h1ZmZsZSIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0Iiwic3RhdHVzIiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsInB1c2giLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJpZCIsImZyb21TZXJ2ZXIiLCJjYXRjaCIsImxvZ2luIiwiY3JlZGVudGlhbHMiLCJwb3N0IiwibWVzc2FnZSIsImxvZ291dCIsImRlc3Ryb3kiLCJzZWxmIiwic2Vzc2lvbklkIiwicmVzb2x2ZSIsIiR0aW1lb3V0Iiwic2xpZGVzIiwic2hvd0xvZ29zIiwic3BvdGxpZ2h0T24iLCJjdXJTb25nUGxheWluZyIsImFjdGl2ZVNvbmdJbmRleCIsImF1ZGlvIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwic2luZ2xlcyIsImNsYXNzIiwic291cmNlIiwibnVtYmVyIiwidG9nZ2xlTG9nb3MiLCJ0b2dnbGVUcmFuc2l0aW9uIiwicmFuZG9tSW1hZ2UiLCJyYW5kIiwiTWF0aCIsInJhbmRvbSIsIm9iU3BvdExpZ2h0IiwiYmlvQmFubmVyIiwiZWxlbWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJjc3MiLCJkYXZlU3BvdExpZ2h0IiwiJHdhdGNoIiwic2V0VGltZW91dCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJjbGFzc0xpc3QiLCJhZGQiLCJ0d3R0ciIsIndpZGdldHMiLCJsb2FkIiwiRkIiLCJYRkJNTCIsInBhcnNlIiwicGF1c2VCcm9hZGNhc3QiLCJudW0iLCJwYXVzZSIsImlkeCIsInRvZ2dsZSIsInNyYyIsInBsYXkiLCJlcnJvciIsInNlbmRMb2dpbiIsImxvZ2luSW5mbyIsInRlbXBsYXRlIiwiU2VjcmV0U3Rhc2giLCJnZXRTdGFzaCIsInN0YXNoIiwiY29uc29sZSIsImxvZyIsImdldFJhbmRvbUZyb21BcnJheSIsImFyciIsImZsb29yIiwibGVuZ3RoIiwiZ3JlZXRpbmdzIiwiZ2V0UmFuZG9tR3JlZXRpbmciLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibGluayIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIiwiaXRlbXMiLCJsYWJlbCIsImF1dGgiLCJpc0NvbGxhcHNlZCIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsInByb3BvZ2F0ZVBhdXNlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBOztBQUVBRixJQUFBRyxNQUFBLENBQUEsVUFBQUMsa0JBQUEsRUFBQUMsaUJBQUEsRUFBQTtBQUNBO0FBQ0FBLHNCQUFBQyxTQUFBLENBQUEsSUFBQTtBQUNBO0FBQ0FGLHVCQUFBRyxTQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0FILHVCQUFBSSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0FULGVBQUFVLFFBQUEsQ0FBQUMsTUFBQTtBQUNBLEtBRkE7QUFHQSxDQVRBOztBQVdBO0FBQ0FWLElBQUFXLEdBQUEsQ0FBQSxVQUFBQyxVQUFBLEVBQUFDLFdBQUEsRUFBQUMsTUFBQSxFQUFBO0FBQ0FGLGVBQUFHLFlBQUEsR0FBQSxLQUFBO0FBQ0E7QUFDQSxRQUFBQywrQkFBQSxTQUFBQSw0QkFBQSxDQUFBQyxLQUFBLEVBQUE7QUFDQSxlQUFBQSxNQUFBQyxJQUFBLElBQUFELE1BQUFD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USxHQUFBLENBQUFnQyxZQUFBUCxZQUFBLEVBQUF5RyxPQUFBO0FBQ0ExSSx1QkFBQVEsR0FBQSxDQUFBZ0MsWUFBQUwsYUFBQSxFQUFBd0csVUFBQTtBQUNBM0ksdUJBQUFRLEdBQUEsQ0FBQWdDLFlBQUFKLGNBQUEsRUFBQXVHLFVBQUE7QUFFQTs7QUFsREEsS0FBQTtBQXNEQSxDQXhEQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuICAgICRyb290U2NvcGUudHJhbnNpdGlvbmVkPSBmYWxzZTtcbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGF2ZScsIHtcbiAgICAgICAgdXJsOiAnL2RhdmUnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZG9jcy9kb2NzLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUNvbnRyb2xsZXInLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dHJhbnNpdGlvbmVkOiBmdW5jdGlvbigpe1xuICAgICAgICBcdFx0cmV0dXJuIGZhbHNlO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwkcm9vdFNjb3BlLCAkdGltZW91dCl7XG5cblx0JHNjb3BlLnNsaWRlcz0gWzEsMiwzXTtcblx0JHNjb3BlLnNob3dMb2dvcz0gZmFsc2U7XG5cdCRzY29wZS5zcG90bGlnaHRPbj0gZmFsc2U7XG5cdCRzY29wZS50cmFuc2l0aW9uZWQ9JHJvb3RTY29wZS50cmFuc2l0aW9uZWQ7XG5cdCRzY29wZS5jdXJTb25nUGxheWluZz0gZmFsc2U7XG5cdCRzY29wZS5hY3RpdmVTb25nSW5kZXg9IDA7IFxuXHQkc2NvcGUuYXVkaW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuXHQkc2NvcGUuc2luZ2xlcz0gW1xuXHR7Y2xhc3M6ICdwcm9wU2luZ2xlJywgc291cmNlOiAnUHJvcHVlc3RhX0VuY2FudGFkb3JhLm1wMycsIG51bWJlcjogMX0sXG5cdHtjbGFzczogJ2ltYWdpbmFTaW5nbGUnLCBzb3VyY2U6ICdJbWFnaW5hdGUubXAzJywgbnVtYmVyOiAyfSxcblx0e2NsYXNzOiAnZGltZVNpbmdsZScsIHNvdXJjZTogJ0RpbWVsb19NYS5tcDMnLCBudW1iZXI6IDN9IFxuXHRdOyBcblxuXHQkc2NvcGUudG9nZ2xlTG9nb3M9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5zaG93TG9nb3M9ICF0aGlzLnNob3dMb2dvcztcblx0fVxuXG5cdCRzY29wZS50b2dnbGVUcmFuc2l0aW9uPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMudHJhbnNpdGlvbmVkPXRydWU7XG5cdFx0JHJvb3RTY29wZS50cmFuc2l0aW9uZWQ9dHJ1ZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRvbUltYWdlKCl7XG5cdFx0dmFyIHJhbmQ9IE1hdGgucmFuZG9tKCk7XG5cdFx0aWYocmFuZCA8IC41ICl7XG5cdFx0XHRyZXR1cm4gMTtcblx0XHR9XG5cdFx0ZWxzZSByZXR1cm4gMjtcblx0fTtcblx0JHNjb3BlLnJhbmRvbT0gcmFuZG9tSW1hZ2UoKTtcblxuXG5cdCRzY29wZS5vYlNwb3RMaWdodD0gZnVuY3Rpb24oKXtcblx0XHR2YXIgYmlvQmFubmVyPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5iaW9CYW5uZXJcIikpO1xuXHRcdGlmKCEkc2NvcGUuc3BvdGxpZ2h0T24pIHtcblx0XHRcdGJpb0Jhbm5lci5jc3Moe1wiYmFja2dyb3VuZC1pbWFnZVwiOiBcInVybCgnb2JIb3Zlci5qcGcnKVwiLCBcIm9wYWNpdHlcIjogXCIxXCJ9KVxuXHRcdFx0JHNjb3BlLnNwb3RsaWdodE9uPSB0cnVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGJpb0Jhbm5lci5jc3Moe1wiYmFja2dyb3VuZC1pbWFnZVwiOiBcInVybCgnbm9Ib3Zlci5qcGcnKVwiLCBcIm9wYWNpdHlcIjogXCIuNVwifSlcblx0XHRcdCRzY29wZS5zcG90bGlnaHRPbj0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0JHNjb3BlLmRhdmVTcG90TGlnaHQ9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGJpb0Jhbm5lcj0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYmlvQmFubmVyXCIpKTtcblx0XHRpZighJHNjb3BlLnNwb3RsaWdodE9uKSB7XG5cdFx0XHRiaW9CYW5uZXIuY3NzKHtcImJhY2tncm91bmQtaW1hZ2VcIjogXCJ1cmwoJ2RhdmVIb3Zlci5qcGcnKVwiLCBcIm9wYWNpdHlcIjogXCIxXCJ9KVxuXHRcdFx0JHNjb3BlLnNwb3RsaWdodE9uPSB0cnVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdGJpb0Jhbm5lci5jc3Moe1wiYmFja2dyb3VuZC1pbWFnZVwiOiBcInVybCgnbm9Ib3Zlci5qcGcnKVwiLCBcIm9wYWNpdHlcIjogXCIuNVwifSlcblx0XHRcdCRzY29wZS5zcG90bGlnaHRPbj0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblxuXHQkc2NvcGUuJHdhdGNoKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpe1xuXHQgICAvLyBkbyBzb21ldGhpbmdcblx0ICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuXHQgICBcdCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubGFuZCcpWzBdLmNsYXNzTGlzdC5hZGQoJ2xhbmRPbicpO1xuXHQgICBcdH0sIDUwMClcblx0IFx0fSk7XG5cblx0JHRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgdHd0dHIud2lkZ2V0cy5sb2FkKCk7XG5cdCAgICAgIFx0IEZCLlhGQk1MLnBhcnNlKCk7XG5cdCAgICAgICAgfSwgMzApO1xuXG5cdCRzY29wZS5wYXVzZUJyb2FkY2FzdD0gZnVuY3Rpb24obnVtKXtcblx0XHQkc2NvcGUuJGJyb2FkY2FzdCgnc29uZ1BhdXNlJywgbnVtKVxuXHR9XG5cblx0JHNjb3BlLiRvbigncGF1c2VPbkxlYXZlJywgZnVuY3Rpb24oKXtcblx0XHQkc2NvcGUuYXVkaW8ucGF1c2UoKTtcblx0fSk7XG5cblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaW5nbGVQbGF5ZXJDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlKXtcblx0JHNjb3BlLmN1clNvbmdQbGF5aW5nPSBmYWxzZTsgXG5cdCRzY29wZS5pZHg9IDA7IFxuXG5cdCRzY29wZS4kb24oJ3NvbmdQYXVzZScsIGZ1bmN0aW9uKGV2ZW50LCBudW0pe1xuXHRcdGlmKG51bSE9PSAkc2NvcGUuaWR4KVxuXHRcdCRzY29wZS5jdXJTb25nUGxheWluZz1mYWxzZTtcblx0fSk7XG5cblx0JHNjb3BlLnRvZ2dsZT0gZnVuY3Rpb24oc291cmNlLCBudW0pe1xuXHRcdC8vIGNvbnNvbGUubG9nKFwiUmVhY2hlZCB0aGUgdG9nZ2xlXCIsICRzY29wZS5pZHgpO1xuXHRcdGlmKHRoaXMuY3VyU29uZ1BsYXlpbmcpe1xuXHRcdFx0JHNjb3BlLmF1ZGlvLnBhdXNlKCk7XG5cdFx0XHR0aGlzLmN1clNvbmdQbGF5aW5nPWZhbHNlO1xuXHRcdH1cblx0XHRlbHNle1xuXHRcdFx0JHNjb3BlLmF1ZGlvLnBhdXNlKCk7XG5cdFx0XHQkc2NvcGUuYXVkaW8uc3JjPSBzb3VyY2U7XG5cdFx0XHQkc2NvcGUuYXVkaW8ucGxheSgpO1xuXHRcdFx0JHNjb3BlLnBhdXNlQnJvYWRjYXN0KG51bSk7XG5cdFx0XHR0aGlzLmN1clNvbmdQbGF5aW5nPXRydWU7XG5cdFx0fVxuXHRcdFxuXHR9XG5cblxuXG59KTtcblxuXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsYW5kaW5nJywge1xuICAgICAgICB1cmw6ICcvbGFuZGluZycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbGFuZGluZy9sYW5kaW5nLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTGFuZGluZ0NvbnRyb2xsZXInXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xhbmRpbmdDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlKXtcblxuXG5cbn0pXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ29iJywge1xuICAgICAgICB1cmw6ICcvb2InLFxuICAgICAgICBjb250cm9sbGVyOiAnT2JDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9vYkJpby9vYi5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ09iQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuICAgIC8vIGNvbnNvbGUubG9nKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lmcmFtZScpWzBdKTtcbiAgIGNvbnNvbGUubG9nKCBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3BoZWFkJykpICk7XG59KTsiLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUGxheWVyRmFjdG9yeScsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXVkaW89IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG4gICAgcmV0dXJuIHtcblxuICAgICAgICBwbGF5OiBmdW5jdGlvbihzcmMpe1xuICAgICAgICAgICAgYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgICAgIGF1ZGlvLnNyYz0gc3JjO1xuICAgICAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhdXNlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuZmFjdG9yeSgnUmFuZG9tR3JlZXRpbmdzJywgZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIGdldFJhbmRvbUZyb21BcnJheSA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfTtcblxuICAgIHZhciBncmVldGluZ3MgPSBbXG4gICAgICAgICdIZWxsbywgd29ybGQhJyxcbiAgICAgICAgJ0F0IGxvbmcgbGFzdCwgSSBsaXZlIScsXG4gICAgICAgICdIZWxsbywgc2ltcGxlIGh1bWFuLicsXG4gICAgICAgICdXaGF0IGEgYmVhdXRpZnVsIGRheSEnLFxuICAgICAgICAnSVxcJ20gbGlrZSBhbnkgb3RoZXIgcHJvamVjdCwgZXhjZXB0IHRoYXQgSSBhbSB5b3Vycy4gOiknLFxuICAgICAgICAnVGhpcyBlbXB0eSBzdHJpbmcgaXMgZm9yIExpbmRzYXkgTGV2aW5lLicsXG4gICAgICAgICfjgZPjgpPjgavjgaHjga/jgIHjg6bjg7zjgrbjg7zmp5jjgIInLFxuICAgICAgICAnV2VsY29tZS4gVG8uIFdFQlNJVEUuJyxcbiAgICAgICAgJzpEJyxcbiAgICAgICAgJ1llcywgSSB0aGluayB3ZVxcJ3ZlIG1ldCBiZWZvcmUuJyxcbiAgICAgICAgJ0dpbW1lIDMgbWlucy4uLiBJIGp1c3QgZ3JhYmJlZCB0aGlzIHJlYWxseSBkb3BlIGZyaXR0YXRhJyxcbiAgICAgICAgJ0lmIENvb3BlciBjb3VsZCBvZmZlciBvbmx5IG9uZSBwaWVjZSBvZiBhZHZpY2UsIGl0IHdvdWxkIGJlIHRvIG5ldlNRVUlSUkVMIScsXG4gICAgXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdyZWV0aW5nczogZ3JlZXRpbmdzLFxuICAgICAgICBnZXRSYW5kb21HcmVldGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGdldFJhbmRvbUZyb21BcnJheShncmVldGluZ3MpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdmb290ZXInLCBmdW5jdGlvbigpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0c2NvcGU6IHt9LFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZm9vdGVyL2Zvb3Rlci5odG1sJyxcblx0XHRsaW5rOiBmdW5jdGlvbigpe1xuXHRcdFx0XG5cdFx0fVxuXHR9XG5cdFxufSkiLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vZnVsbHN0YWNrLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7XG5cbmFwcC5kaXJlY3RpdmUoJ2JsYWNrd2hpdGVMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vb2ItYndMb2dvLmh0bWwnXG4gICAgfTtcbn0pO1xuXG5hcHAuZGlyZWN0aXZlKCdtaWxsaW9uZG9sbGFyTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL21kLUxvZ28uaHRtbCdcbiAgICB9O1xufSk7XG5cbmFwcC5kaXJlY3RpdmUoJ2FwcGxlTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2FwcGxlLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdEYXZlJywgc3RhdGU6ICdkYXZlJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdPLkInLCAgc3RhdGU6ICdvYid9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdDb250YWN0Jywgc3RhdGU6ICdkb2NzJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIHNjb3BlLmlzQ29sbGFwc2VkID0gdHJ1ZTtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5wYXVzZT0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzY29wZS4kYnJvYWRjYXN0KCdzb25nUGF1c2UnLCBudW0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5wcm9wb2dhdGVQYXVzZT0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3BhdXNlT25MZWF2ZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG4iXX0=
