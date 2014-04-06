var SpotifyPlaylistsImporter = function() {
  this.callback = null;
  this.authWindow = null;

  var that = this;
  function receiveMessage(event){
    if (event.origin !== "http://localhost:8000") {
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
    client_id: '8d17e83b5fd84c38a7e41fdc57291de3',
    redirect_uri: 'http://localhost:8000/src/callback.html',
    scope: 'user-read-private playlist-read playlist-read-private',
    response_type: 'token'
  };
  this.authWindow = window.open(
    "https://accounts.spotify.com/authorize?" + toQueryString(params),
    "Spotify",
    'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
  );
};

SpotifyPlaylistsImporter.prototype._signedRequest = function(url, accessToken) {
  var deferred = when.defer();
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
//      deferred.reject(new Error('Playlist not found: ' + url));
    }
  };
  req.send(null);
  return deferred.promise;
};

SpotifyPlaylistsImporter.prototype.importPlaylists = function(accessToken, callback) {
  console.log('importPlaylists', accessToken);
  var that = this;
  this._signedRequest('https://api.spotify.com/v1/me', accessToken)
    .then(function(data) {
      var user_id = data.id;
      that._signedRequest('https://api.spotify.com/v1/users/' + user_id + '/playlists', accessToken)
        .then(function(data) {
          console.log('Playlists dude', data);

          var deferreds = [];

          data.forEach(function(playlist) {
            deferreds.push(that._signedRequest(playlist.api_link, accessToken));
          });

          var all = when.all(deferreds);
          all.then(function(results) {
            console.log('All playlists where imported');
            callback(results);
          }, function() {
              // one or more failed
            console.log('Some of them failed', results);
            callback(results);
          });

        });
      });
    };
