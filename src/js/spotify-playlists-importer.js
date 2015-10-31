var SpotifyPlaylistsImporter = function() {
  this.callback = null;
  this.authWindow = null;

  var that = this;
  function receiveMessage(event){
    if (event.origin !== "http://localhost:8000" &&
      event.origin !== "https://jmperezperez.com") {
      return;
    }
    if (!event.data.accessToken) {
      return;
    }
    if (that.authWindow) {
      that.authWindow.close();
    }
    if (that.callback !== null) {
      that.callback(event.data.accessToken);
      that.callback = null;
    }
  }

  window.addEventListener("message", receiveMessage, false);
};

SpotifyPlaylistsImporter.prototype.login = function(callback) {
  this.callback = callback;

  function toQueryString(obj) {
    var parts = [];
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
      }
    }
    return parts.join("&");
  }

  var width = 400,
      height = 500;
  var left = (screen.width / 2) - (width / 2);
  var top = (screen.height / 2) - (height / 2);
  var params = {
    client_id: '11e8de06c78d4fa6be4bf61400301195',
    redirect_uri: 'http://localhost:8000/src/callback.html',
    // note: you can also use 'http://localhost:8000/build/callback.html' when
    // serving it from the minified version
    scope: 'playlist-read playlist-read-private',
    response_type: 'token'
  };

  if (location.hostname === 'jmperezperez.com') {
    params.redirect_uri = 'https://jmperezperez.com/spotify-iquiz/callback.html';
  }

  this.authWindow = window.open(
    "https://accounts.spotify.com/authorize?" + toQueryString(params),
    "Spotify",
    'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
  );
};

SpotifyPlaylistsImporter.prototype._signedRequest = function(url, accessToken) {
  var deferred = Q.defer();
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  var that = this;
  req.setRequestHeader('Authorization', 'Bearer ' + accessToken);
  req.onload = function() {
    if (req.status == 200) {
      var data = JSON.parse(req.responseText);
      deferred.resolve(data);
    } else {
      deferred.resolve(null);
    }
  };
  req.send(null);
  return deferred.promise;
};

SpotifyPlaylistsImporter.prototype.importPlaylists = function(accessToken, callback) {

  spotifyWebApi.setAccessToken(accessToken);
  spotifyWebApi.getMe().then(function(data) {

    spotifyWebApi.getUserPlaylists(data.id).then(function(data) {

      var deferreds = [];

      var maxPlaylists = 25;
      var playlists = data.items.slice(0, maxPlaylists);
      playlists.forEach(function(playlist) {
        deferreds.push(spotifyWebApi.getGeneric(playlist.tracks.href));
      });

      Q.allSettled(deferreds)
      .then(function(results) {
        var successfulResults = results.filter(function(result) {
          return result.state === 'fulfilled';
        }).map(function(result) {
          return result.value;
        });
        callback(successfulResults);
      });
    });
  });
};
