app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html',
        controller: 'HomeController',
        resolve: {
        	transitioned: function(){
        		return false;
        	}
        }
    });
});

app.controller('HomeController', function($scope,$rootScope, $timeout){

	$scope.slides= [1,2,3];
	$scope.showLogos= false;
	$scope.spotlightOn= false;
	$scope.transitioned=$rootScope.transitioned;
	$scope.curSongPlaying= false;
	$scope.activeSongIndex= 0; 
	$scope.audio = document.createElement('audio');
	$scope.singles= [
	{class: 'propSingle', source: 'Propuesta_Encantadora.mp3', number: 1},
	{class: 'imaginaSingle', source: 'Imaginate.mp3', number: 2},
	{class: 'dimeSingle', source: 'Dimelo_Ma.mp3', number: 3} 
	]; 

	$scope.toggleLogos= function(){
		this.showLogos= !this.showLogos;
	}

	$scope.toggleTransition= function(){
		this.transitioned=true;
		$rootScope.transitioned=true;
	}

	function randomImage(){
		var rand= Math.random();
		if(rand < .5 ){
			return 1;
		}
		else return 2;
	};
	$scope.random= randomImage();


	$scope.obSpotLight= function(){
		var bioBanner= angular.element(document.querySelector(".bioBanner"));
		if(!$scope.spotlightOn) {
			bioBanner.css({"background-image": "url('obHover.jpg')", "opacity": "1"})
			$scope.spotlightOn= true;
		}
		else {
			bioBanner.css({"background-image": "url('noHover.jpg')", "opacity": ".5"})
			$scope.spotlightOn= false;
		}
	}

	$scope.daveSpotLight= function(){
		var bioBanner= angular.element(document.querySelector(".bioBanner"));
		if(!$scope.spotlightOn) {
			bioBanner.css({"background-image": "url('daveHover.jpg')", "opacity": "1"})
			$scope.spotlightOn= true;
		}
		else {
			bioBanner.css({"background-image": "url('noHover.jpg')", "opacity": ".5"})
			$scope.spotlightOn= false;
		}
	}


	$scope.$watch('$viewContentLoaded', function(){
	   // do something
	   setTimeout(function(){
	   	 document.querySelectorAll('.land')[0].classList.add('landOn');
	   	}, 500)
	 	});

	$timeout(function () {
	          twttr.widgets.load();
	      	 FB.XFBML.parse();
	        }, 30);

	$scope.pauseBroadcast= function(num){
		$scope.$broadcast('songPause', num)
	}

	$scope.$on('pauseOnLeave', function(){
		$scope.audio.pause();
	});


});

app.controller('SinglePlayerCtrl', function($scope, $rootScope){
	$scope.curSongPlaying= false; 
	$scope.idx= 0; 

	$scope.$on('songPause', function(event, num){
		if(num!== $scope.idx)
		$scope.curSongPlaying=false;
	});

	$scope.toggle= function(source, num){
		// console.log("Reached the toggle", $scope.idx);
		if(this.curSongPlaying){
			$scope.audio.pause();
			this.curSongPlaying=false;
		}
		else{
			$scope.audio.pause();
			$scope.audio.src= source;
			$scope.audio.play();
			$scope.pauseBroadcast(num);
			this.curSongPlaying=true;
		}
		
	}



});


