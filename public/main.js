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

    function randomMobileImage() {
        var rand = Math.random();
        if (rand < .5) {
            return "White";
        } else return "Black";
    }
    $scope.randomMobile = randomMobileImage();

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsYW5kaW5nL2xhbmRpbmcuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJvYkJpby9vYkJpby5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUGxheWVyRmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZm9vdGVyL2Zvb3Rlci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsIm90aGVyd2lzZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsInJ1biIsIiRyb290U2NvcGUiLCJBdXRoU2VydmljZSIsIiRzdGF0ZSIsInRyYW5zaXRpb25lZCIsImRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgiLCJzdGF0ZSIsImRhdGEiLCJhdXRoZW50aWNhdGUiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImlzQXV0aGVudGljYXRlZCIsInByZXZlbnREZWZhdWx0IiwiZ2V0TG9nZ2VkSW5Vc2VyIiwidGhlbiIsInVzZXIiLCJnbyIsIm5hbWUiLCIkc3RhdGVQcm92aWRlciIsInVybCIsImNvbnRyb2xsZXIiLCJ0ZW1wbGF0ZVVybCIsIiRzY29wZSIsIkZ1bGxzdGFja1BpY3MiLCJpbWFnZXMiLCJfIiwic2h1ZmZsZSIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0Iiwic3RhdHVzIiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsInB1c2giLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJpZCIsImZyb21TZXJ2ZXIiLCJjYXRjaCIsImxvZ2luIiwiY3JlZGVudGlhbHMiLCJwb3N0IiwibWVzc2FnZSIsImxvZ291dCIsImRlc3Ryb3kiLCJzZWxmIiwic2Vzc2lvbklkIiwicmVzb2x2ZSIsIiR0aW1lb3V0Iiwic2xpZGVzIiwic2hvd0xvZ29zIiwic3BvdGxpZ2h0T24iLCJjdXJTb25nUGxheWluZyIsImFjdGl2ZVNvbmdJbmRleCIsImF1ZGlvIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50Iiwic2luZ2xlcyIsImNsYXNzIiwic291cmNlIiwibnVtYmVyIiwidG9nZ2xlTG9nb3MiLCJ0b2dnbGVUcmFuc2l0aW9uIiwicmFuZG9tSW1hZ2UiLCJyYW5kIiwiTWF0aCIsInJhbmRvbSIsInJhbmRvbU1vYmlsZUltYWdlIiwicmFuZG9tTW9iaWxlIiwib2JTcG90TGlnaHQiLCJiaW9CYW5uZXIiLCJlbGVtZW50IiwicXVlcnlTZWxlY3RvciIsImNzcyIsImRhdmVTcG90TGlnaHQiLCIkd2F0Y2giLCJzZXRUaW1lb3V0IiwicXVlcnlTZWxlY3RvckFsbCIsImNsYXNzTGlzdCIsImFkZCIsInR3dHRyIiwid2lkZ2V0cyIsImxvYWQiLCJGQiIsIlhGQk1MIiwicGFyc2UiLCJwYXVzZUJyb2FkY2FzdCIsIm51bSIsInBhdXNlIiwiaWR4IiwidG9nZ2xlIiwic3JjIiwicGxheSIsImVycm9yIiwic2VuZExvZ2luIiwibG9naW5JbmZvIiwidGVtcGxhdGUiLCJTZWNyZXRTdGFzaCIsImdldFN0YXNoIiwic3Rhc2giLCJjb25zb2xlIiwibG9nIiwiZ2V0UmFuZG9tRnJvbUFycmF5IiwiYXJyIiwiZmxvb3IiLCJsZW5ndGgiLCJncmVldGluZ3MiLCJnZXRSYW5kb21HcmVldGluZyIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJsaW5rIiwiaXRlbXMiLCJsYWJlbCIsImF1dGgiLCJpc0NvbGxhcHNlZCIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsInByb3BvZ2F0ZVBhdXNlIiwiUmFuZG9tR3JlZXRpbmdzIiwiZ3JlZXRpbmciXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBQSxPQUFBQyxHQUFBLEdBQUFDLFFBQUFDLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUE7O0FBRUFGLElBQUFHLE1BQUEsQ0FBQSxVQUFBQyxrQkFBQSxFQUFBQyxpQkFBQSxFQUFBO0FBQ0E7QUFDQUEsc0JBQUFDLFNBQUEsQ0FBQSxJQUFBO0FBQ0E7QUFDQUYsdUJBQUFHLFNBQUEsQ0FBQSxHQUFBO0FBQ0E7QUFDQUgsdUJBQUFJLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQVQsZUFBQVUsUUFBQSxDQUFBQyxNQUFBO0FBQ0EsS0FGQTtBQUdBLENBVEE7O0FBV0E7QUFDQVYsSUFBQVcsR0FBQSxDQUFBLFVBQUFDLFVBQUEsRUFBQUMsV0FBQSxFQUFBQyxNQUFBLEVBQUE7QUFDQUYsZUFBQUcsWUFBQSxHQUFBLEtBQUE7QUFDQTtBQUNBLFFBQUFDLCtCQUFBLFNBQUFBLDRCQUFBLENBQUFDLEtBQUEsRUFB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MUksdUJBQUFRLEdBQUEsQ0FBQWdDLFlBQUFQLFlBQUEsRUFBQXlHLE9BQUE7QUFDQTFJLHVCQUFBUSxHQUFBLENBQUFnQyxZQUFBTCxhQUFBLEVBQUF3RyxVQUFBO0FBQ0EzSSx1QkFBQVEsR0FBQSxDQUFBZ0MsWUFBQUosY0FBQSxFQUFBdUcsVUFBQTtBQUVBOztBQWxEQSxLQUFBO0FBc0RBLENBeERBOztBQ0FBdkosSUFBQTZJLFNBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQVksZUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQVgsa0JBQUEsR0FEQTtBQUVBNUcscUJBQUEseURBRkE7QUFHQThHLGNBQUEsY0FBQUQsS0FBQSxFQUFBO0FBQ0FBLGtCQUFBVyxRQUFBLEdBQUFELGdCQUFBYixpQkFBQSxFQUFBO0FBQ0E7QUFMQSxLQUFBO0FBUUEsQ0FWQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuICAgICRyb290U2NvcGUudHJhbnNpdGlvbmVkPSBmYWxzZTtcbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZGF2ZScsIHtcbiAgICAgICAgdXJsOiAnL2RhdmUnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvZG9jcy9kb2NzLmh0bWwnXG4gICAgfSk7XG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUNvbnRyb2xsZXInLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0dHJhbnNpdGlvbmVkOiBmdW5jdGlvbigpe1xuICAgICAgICBcdFx0cmV0dXJuIGZhbHNlO1xuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwkcm9vdFNjb3BlLCAkdGltZW91dCl7XG5cblx0JHNjb3BlLnNsaWRlcz0gWzEsMiwzXTtcblx0JHNjb3BlLnNob3dMb2dvcz0gZmFsc2U7XG5cdCRzY29wZS5zcG90bGlnaHRPbj0gZmFsc2U7XG5cdCRzY29wZS50cmFuc2l0aW9uZWQ9JHJvb3RTY29wZS50cmFuc2l0aW9uZWQ7XG5cdCRzY29wZS5jdXJTb25nUGxheWluZz0gZmFsc2U7XG5cdCRzY29wZS5hY3RpdmVTb25nSW5kZXg9IDA7IFxuXHQkc2NvcGUuYXVkaW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuXHQkc2NvcGUuc2luZ2xlcz0gW1xuXHR7Y2xhc3M6ICdwcm9wU2luZ2xlJywgc291cmNlOiAnUHJvcHVlc3RhX0VuY2FudGFkb3JhLm1wMycsIG51bWJlcjogMX0sXG5cdHtjbGFzczogJ2ltYWdpbmFTaW5nbGUnLCBzb3VyY2U6ICdJbWFnaW5hdGUubXAzJywgbnVtYmVyOiAyfSxcblx0e2NsYXNzOiAnZGltZVNpbmdsZScsIHNvdXJjZTogJ0RpbWVsb19NYS5tcDMnLCBudW1iZXI6IDN9IFxuXHRdOyBcblxuXHQkc2NvcGUudG9nZ2xlTG9nb3M9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5zaG93TG9nb3M9ICF0aGlzLnNob3dMb2dvcztcblx0fVxuXG5cdCRzY29wZS50b2dnbGVUcmFuc2l0aW9uPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMudHJhbnNpdGlvbmVkPXRydWU7XG5cdFx0JHJvb3RTY29wZS50cmFuc2l0aW9uZWQ9dHJ1ZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJhbmRvbUltYWdlKCl7XG5cdFx0dmFyIHJhbmQ9IE1hdGgucmFuZG9tKCk7XG5cdFx0aWYocmFuZCA8IC41ICl7XG5cdFx0XHRyZXR1cm4gMTtcblx0XHR9XG5cdFx0ZWxzZSByZXR1cm4gMjtcblx0fTtcblx0JHNjb3BlLnJhbmRvbT0gcmFuZG9tSW1hZ2UoKTtcblxuXHRmdW5jdGlvbiByYW5kb21Nb2JpbGVJbWFnZSgpe1xuXHRcdHZhciByYW5kPSBNYXRoLnJhbmRvbSgpO1xuXHRcdGlmKHJhbmQgPCAuNSl7XG5cdFx0XHRyZXR1cm4gXCJXaGl0ZVwiO1xuXHRcdH1cblx0XHRlbHNlIHJldHVybiBcIkJsYWNrXCJcblx0fVxuXHQkc2NvcGUucmFuZG9tTW9iaWxlPSByYW5kb21Nb2JpbGVJbWFnZSgpO1xuXG5cblx0JHNjb3BlLm9iU3BvdExpZ2h0PSBmdW5jdGlvbigpe1xuXHRcdHZhciBiaW9CYW5uZXI9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmJpb0Jhbm5lclwiKSk7XG5cdFx0aWYoISRzY29wZS5zcG90bGlnaHRPbikge1xuXHRcdFx0YmlvQmFubmVyLmNzcyh7XCJiYWNrZ3JvdW5kLWltYWdlXCI6IFwidXJsKCdvYkhvdmVyLmpwZycpXCIsIFwib3BhY2l0eVwiOiBcIjFcIn0pXG5cdFx0XHQkc2NvcGUuc3BvdGxpZ2h0T249IHRydWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0YmlvQmFubmVyLmNzcyh7XCJiYWNrZ3JvdW5kLWltYWdlXCI6IFwidXJsKCdub0hvdmVyLmpwZycpXCIsIFwib3BhY2l0eVwiOiBcIi41XCJ9KVxuXHRcdFx0JHNjb3BlLnNwb3RsaWdodE9uPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQkc2NvcGUuZGF2ZVNwb3RMaWdodD0gZnVuY3Rpb24oKXtcblx0XHR2YXIgYmlvQmFubmVyPSBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5iaW9CYW5uZXJcIikpO1xuXHRcdGlmKCEkc2NvcGUuc3BvdGxpZ2h0T24pIHtcblx0XHRcdGJpb0Jhbm5lci5jc3Moe1wiYmFja2dyb3VuZC1pbWFnZVwiOiBcInVybCgnZGF2ZUhvdmVyLmpwZycpXCIsIFwib3BhY2l0eVwiOiBcIjFcIn0pXG5cdFx0XHQkc2NvcGUuc3BvdGxpZ2h0T249IHRydWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0YmlvQmFubmVyLmNzcyh7XCJiYWNrZ3JvdW5kLWltYWdlXCI6IFwidXJsKCdub0hvdmVyLmpwZycpXCIsIFwib3BhY2l0eVwiOiBcIi41XCJ9KVxuXHRcdFx0JHNjb3BlLnNwb3RsaWdodE9uPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXG5cdCRzY29wZS4kd2F0Y2goJyR2aWV3Q29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCl7XG5cdCAgIC8vIGRvIHNvbWV0aGluZ1xuXHQgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cdCAgIFx0IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5sYW5kJylbMF0uY2xhc3NMaXN0LmFkZCgnbGFuZE9uJyk7XG5cdCAgIFx0fSwgNTAwKVxuXHQgXHR9KTtcblxuXHQkdGltZW91dChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICB0d3R0ci53aWRnZXRzLmxvYWQoKTtcblx0ICAgICAgXHQgRkIuWEZCTUwucGFyc2UoKTtcblx0ICAgICAgICB9LCAzMCk7XG5cblx0JHNjb3BlLnBhdXNlQnJvYWRjYXN0PSBmdW5jdGlvbihudW0pe1xuXHRcdCRzY29wZS4kYnJvYWRjYXN0KCdzb25nUGF1c2UnLCBudW0pXG5cdH1cblxuXHQkc2NvcGUuJG9uKCdwYXVzZU9uTGVhdmUnLCBmdW5jdGlvbigpe1xuXHRcdCRzY29wZS5hdWRpby5wYXVzZSgpO1xuXHR9KTtcblxuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpbmdsZVBsYXllckN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUpe1xuXHQkc2NvcGUuY3VyU29uZ1BsYXlpbmc9IGZhbHNlOyBcblx0JHNjb3BlLmlkeD0gMDsgXG5cblx0JHNjb3BlLiRvbignc29uZ1BhdXNlJywgZnVuY3Rpb24oZXZlbnQsIG51bSl7XG5cdFx0aWYobnVtIT09ICRzY29wZS5pZHgpXG5cdFx0JHNjb3BlLmN1clNvbmdQbGF5aW5nPWZhbHNlO1xuXHR9KTtcblxuXHQkc2NvcGUudG9nZ2xlPSBmdW5jdGlvbihzb3VyY2UsIG51bSl7XG5cdFx0Ly8gY29uc29sZS5sb2coXCJSZWFjaGVkIHRoZSB0b2dnbGVcIiwgJHNjb3BlLmlkeCk7XG5cdFx0aWYodGhpcy5jdXJTb25nUGxheWluZyl7XG5cdFx0XHQkc2NvcGUuYXVkaW8ucGF1c2UoKTtcblx0XHRcdHRoaXMuY3VyU29uZ1BsYXlpbmc9ZmFsc2U7XG5cdFx0fVxuXHRcdGVsc2V7XG5cdFx0XHQkc2NvcGUuYXVkaW8ucGF1c2UoKTtcblx0XHRcdCRzY29wZS5hdWRpby5zcmM9IHNvdXJjZTtcblx0XHRcdCRzY29wZS5hdWRpby5wbGF5KCk7XG5cdFx0XHQkc2NvcGUucGF1c2VCcm9hZGNhc3QobnVtKTtcblx0XHRcdHRoaXMuY3VyU29uZ1BsYXlpbmc9dHJ1ZTtcblx0XHR9XG5cdFx0XG5cdH1cblxuXG5cbn0pO1xuXG5cbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xhbmRpbmcnLCB7XG4gICAgICAgIHVybDogJy9sYW5kaW5nJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sYW5kaW5nL2xhbmRpbmcuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMYW5kaW5nQ29udHJvbGxlcidcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignTGFuZGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUpe1xuXG5cblxufSlcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnb2InLCB7XG4gICAgICAgIHVybDogJy9vYicsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdPYkNvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL29iQmlvL29iLmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignT2JDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG4gICAgLy8gY29uc29sZS5sb2coZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaWZyYW1lJylbMF0pO1xuICAgY29uc29sZS5sb2coIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcGhlYWQnKSkgKTtcbn0pOyIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdQbGF5ZXJGYWN0b3J5JywgZnVuY3Rpb24gKCkge1xuICAgIHZhciBhdWRpbz0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHBsYXk6IGZ1bmN0aW9uKHNyYyl7XG4gICAgICAgICAgICBhdWRpby5wYXVzZSgpO1xuICAgICAgICAgICAgYXVkaW8uc3JjPSBzcmM7XG4gICAgICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGF1c2U6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhdWRpby5wYXVzZSgpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Zvb3RlcicsIGZ1bmN0aW9uKCl7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRzY29wZToge30sXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mb290ZXIvZm9vdGVyLmh0bWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcblx0XHR9XG5cdH1cblx0XG59KSIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTtcblxuYXBwLmRpcmVjdGl2ZSgnYmxhY2t3aGl0ZUxvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9vYi1id0xvZ28uaHRtbCdcbiAgICB9O1xufSk7XG5cbmFwcC5kaXJlY3RpdmUoJ21pbGxpb25kb2xsYXJMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vbWQtTG9nby5odG1sJ1xuICAgIH07XG59KTtcblxuYXBwLmRpcmVjdGl2ZSgnYXBwbGVMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZnVsbHN0YWNrLWxvZ28vYXBwbGUtbG9nby5odG1sJ1xuICAgIH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnRGF2ZScsIHN0YXRlOiAnZGF2ZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTy5CJywgIHN0YXRlOiAnb2InfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQ29udGFjdCcsIHN0YXRlOiAnZG9jcycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICBzY29wZS5pc0NvbGxhcHNlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUucGF1c2U9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGJyb2FkY2FzdCgnc29uZ1BhdXNlJywgbnVtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUucHJvcG9nYXRlUGF1c2U9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdwYXVzZU9uTGVhdmUnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyJdfQ==
