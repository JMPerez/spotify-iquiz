import SpotifyWebApi from './spotify-api-wrapper';

var CLIENT_ID = 'bb200fb215c346448b3c34bbccaac25d';

// The redirect URI must match exactly what is registered in the Spotify
// dashboard. In production the app is served under /spotify-iquiz/; in
// development it is served from the origin root (localhost or 127.0.0.1).
function getRedirectUri() {
  if (location.hostname === 'jmperezperez.com') {
    return 'https://jmperezperez.com/spotify-iquiz/callback.html';
  }
  return location.origin + '/callback.html';
}

function toQueryString(obj) {
  var parts = [];
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      parts.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));
    }
  }
  return parts.join('&');
}

// --- PKCE helpers (Authorization Code flow with PKCE) ---
function generateRandomString(length) {
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var values = crypto.getRandomValues(new Uint8Array(length));
  var result = '';
  for (var i = 0; i < values.length; i++) {
    result += possible[values[i] % possible.length];
  }
  return result;
}

function sha256(plain) {
  var data = new TextEncoder().encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(buffer) {
  var bytes = new Uint8Array(buffer);
  var str = '';
  for (var i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

var SpotifyPlaylistsImporter = function () {
  this.callback = null;
  this.authWindow = null;
  this.codeVerifier = null;

  var that = this;
  function receiveMessage(event) {
    // The callback page is same-origin as the app, so a valid message can
    // only come from our own origin.
    if (event.origin !== window.location.origin) {
      return;
    }
    if (!event.data || !event.data.code) {
      return;
    }
    that.exchangeCodeForToken(event.data.code);
  }

  window.addEventListener('message', receiveMessage, false);
};

SpotifyPlaylistsImporter.prototype.login = function (callback) {
  this.callback = callback;
  var that = this;

  this.codeVerifier = generateRandomString(64);

  return sha256(this.codeVerifier)
    .then(base64urlencode)
    .then(function (codeChallenge) {
      var width = 400,
        height = 500;
      var left = screen.width / 2 - width / 2;
      var top = screen.height / 2 - height / 2;
      var params = {
        client_id: CLIENT_ID,
        redirect_uri: getRedirectUri(),
        scope: 'playlist-read-private',
        response_type: 'code',
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
      };

      that.authWindow = window.open(
        'https://accounts.spotify.com/authorize?' + toQueryString(params),
        'Spotify',
        'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' +
          width +
          ', height=' +
          height +
          ', top=' +
          top +
          ', left=' +
          left
      );
    });
};

SpotifyPlaylistsImporter.prototype.exchangeCodeForToken = function (code) {
  var that = this;
  var body = toQueryString({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: getRedirectUri(),
    code_verifier: this.codeVerifier,
  });

  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body,
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (that.authWindow) {
        that.authWindow.close();
      }
      if (data.error) {
        throw new Error(
          'Spotify token exchange failed: ' +
            data.error +
            (data.error_description ? ' (' + data.error_description + ')' : '')
        );
      }
      if (that.callback !== null) {
        that.callback(data.access_token);
        that.callback = null;
      }
    })
    .catch(function (err) {
      console.error('Spotify sign-in failed:', err);
    });
};

SpotifyPlaylistsImporter.prototype._signedRequest = function (
  url,
  accessToken
) {
  return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    req.onload = function () {
      if (req.status == 200) {
        var data = JSON.parse(req.responseText);
        resolve(data);
      } else {
        resolve(null);
      }
    };
    req.send(null);
  });
};

SpotifyPlaylistsImporter.prototype.importPlaylists = function (
  accessToken,
  callback
) {
  var spotifyWebApi = new SpotifyWebApi();
  spotifyWebApi.setAccessToken(accessToken);
  spotifyWebApi.getMe().then(function (data) {
    spotifyWebApi.getUserPlaylists(data.id).then(function (data) {
      var deferreds = [];

      var maxPlaylists = 25;
      var playlists = data.items.slice(0, maxPlaylists);
      playlists.forEach(function (playlist) {
        deferreds.push(spotifyWebApi.getGeneric(playlist.tracks.href));
      });

      Promise.all(deferreds).then(function (results) {
        callback(results);
      });
    });
  });
};

export default SpotifyPlaylistsImporter;
