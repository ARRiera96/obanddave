app.factory('PlayerFactory', function () {
    var audio= document.createElement('audio');
    return {

        play: function(src){
            audio.pause();
            audio.src= src;
            audio.play();
        },

        pause: function(){
            audio.pause();
        }

    };

});
