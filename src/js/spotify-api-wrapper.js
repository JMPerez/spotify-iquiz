var SpotifyAPIWrapper = (function() {

  var baseUri = 'https://api.spotify.com/v1';

  function performRequest(requestData) {
    var deferred = Q.defer();
    var req = new XMLHttpRequest();
    req.open(requestData.type || 'GET', requestData.url, true);
    
    if (requestData.accessToken) {
      req.setRequestHeader('Authorization', 'Bearer ' + requestData.accessToken);
    }

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
  }

  function me(requestData) {
    requestData = requestData || {};
    requestData.url = baseUri + '/me';

    return performRequest(requestData);
  }

  function user(userId) {
    requestData = requestData || {};
    requestData.url = baseUri + '/users/' + userId ;

    return performRequest(requestData);
  }

  function userPlaylists(userId, requestData) {
    requestData = requestData || {};
    requestData.url = baseUri + '/users/' + userId + '/playlists';

    return performRequest(requestData);
  }

  function generic(requestData) {
    return performRequest(requestData);
  }

  function album(albumId, requestData) {
    requestData = requestData || {};
    requestData.url = baseUri + '/albums/' + albumId;
    return performRequest(requestData);
  }

  function track(trackId, requestData) {
    requestData = requestData || {};
    requestData.url = baseUri + '/tracks/' + trackId;
    return performRequest(requestData);
  }

  function artist(artistId, requestData) {
    requestData = requestData || {};
    requestData.url = baseUri + '/artists/' + artistId;
    return performRequest(requestData);
  }

  return {
    generic: generic,
    album: album,
    artist: artist,
    track: track,
    me: me,
    user: user,
    userPlaylists: userPlaylists
  };
})();
