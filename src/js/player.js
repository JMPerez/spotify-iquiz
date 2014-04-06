var Player = function() {
  this._audioObject = null;
};

Player.prototype.play = function(question) {
  console.log('Playing', question);

  switch (question.type) {
    case 'guess_album_year':
      var req = new XMLHttpRequest();
      req.open('GET', 'https://api.spotify.com/v1/albums/' + question.spotify_id, true);
      var that = this;
      req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
          var data = JSON.parse(req.responseText);
          that.pause(function() {
            that._audioObject = new Audio(data.tracks[0].preview_url);
            that._audioObject.volume = 0;
            that._audioObject.play();
            that.goToVolume(0.5);
          });
        }
      };
      req.send(null);
      break;

    case 'guess_track_name':
    case 'guess_track_artist':
      var req = new XMLHttpRequest();
      req.open('GET', 'https://api.spotify.com/v1/tracks/' + question.spotify_id, true);
      var that = this;
      req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
          var data = JSON.parse(req.responseText);
          that.pause(function() {
            that._audioObject = new Audio(data.preview_url);
            that._audioObject.volume = 0;
            that._audioObject.play();
            that.goToVolume(0.5);
          });
        }
      };
      req.send(null);
      break;
    }
};

Player.prototype.pause = function(callback) {
  this.goToVolume(0, callback);
};

Player.prototype.goToVolume = function(targetVolume, callback) {
  var that = this;
  if (this._audioObject !== null) {
    var interval = setInterval(function() {
      if (that._audioObject.volume > targetVolume) {
        that._audioObject.volume = Math.max(that._audioObject.volume -0.1, targetVolume);
      } else {
        that._audioObject.volume = Math.min(that._audioObject.volume + 0.1, targetVolume);
      }
      if (that._audioObject.volume === targetVolume) {
        clearInterval(interval);
        if (callback) {
          callback();
        }
      }
    }, 100);
  } else {
    callback();
  }
};
