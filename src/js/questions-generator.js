var QuestionsGeneratorHelper = {
  getAlbum: function(id, callback) {
    console.log('Getting album', id);
    var req = new XMLHttpRequest();
    req.open('GET', 'https://api.spotify.com/v1/albums/' + id, true);
    var that = this;
    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        var data = JSON.parse(req.responseText);
        callback(data);
      }
    };
    req.send(null);
  }
};

var QuestionsGenerator = function(playlists) {
  this.playlists = playlists;
  this._tracks = [];
}

QuestionsGenerator.prototype.load = function() {
  var that = this;
  this._tracks = [];
  this.playlists.forEach(function(p) {
    if (p !== null) {
      that._tracks = that._tracks.concat(p.items.map(function(i) {
        return i.track;
      }));
    }
  });

  this._artists = {};
  this._tracks.forEach(function(t) {
    t.artists.forEach(function(a) {
      if (!(a.name in that._artists)) {
        that._artists[a.name] = 1;
      }
    });
  });

  this._artistsArray = Object.keys(this._artists);
}

QuestionsGenerator.prototype.getTracks = function() {
  return this._tracks;
};

QuestionsGenerator.prototype.getArtists = function() {
  return this._artistsArray;
};

QuestionsGenerator.prototype.generateQuestions = function(callback) {
  var questionTypes = ['guess_track_artist', 'guess_track_name', 'guess_album_year'];

  var numberQuestions = 10;

  var questions = [];

  var promises = [];

  var that = this;

  var pending = 0;

  // fetch album images for some tracks
  // fetch album images for some tracks
  // // fetch album images for some tracks
  for (var i = 0; i < numberQuestions; i++) {
    // todo: check that this is not duplicated
    var questionType = questionTypes[(Math.random() * questionTypes.length) | 0];
    var track = this._tracks[(Math.random() * this._tracks.length) | 0];

    switch (questionType) {
      case 'guess_track_artist':
        var question = new GuessTrackArtistQuestion(track.id, track.artists[0].name);
        questions.push(question);
        break;
      case 'guess_album_year':
        pending++;
        var question = new GuessAlbumYearQuestion(track.id, track.album.id);
        questions.push(question);
        question.fetchAlbumInfo(function() {
          pending--;
          if (pending === 0) callback(that._cleanAndRandomize(questions));
        });
        break;
    case 'guess_track_name':
        pending++;
        var question = new GuessTrackNameQuestion(track.name, track.id, track.album.id);
        questions.push(question);
        question.fetchCover(function() {
          pending--;
          if (pending === 0) callback(that._cleanAndRandomize(questions));
        });
        break;
    }
  }

  if (pending === 0) {
    callback(this._cleanAndRandomize(questions));
  }
};

QuestionsGenerator.prototype._cleanAndRandomize = function(questions) {
  /**
   * Randomize array element order in-place.
   * Using Fisher-Yates shuffle algorithm.
   */
  function shuffleArray(array) {
      for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
      }
      return array;
  }

  var shuffled = shuffleArray(questions);
  return shuffled.map(function(q) { return q.getJSON()});
};

var GuessTrackNameQuestion = function(trackName, trackId, albumId) {
  this.trackName = trackName;
  this.trackId = trackId;
  this.albumId = albumId;
  this.others = this._getRandomTrackName(trackName, 2);
  this.cover = null;
};

GuessTrackNameQuestion.prototype._getRandomTrackName = function(basedOnTrack, amount) {
  var selectedTracks = [];
  while (selectedTracks.length < amount) {
    var candidate = generator.getTracks()[(Math.random() * generator.getTracks().length) | 0].name;
    if (candidate != basedOnTrack && selectedTracks.indexOf(candidate) === -1) {
      selectedTracks.push(candidate);
    }
  }
  return selectedTracks;
};

GuessTrackNameQuestion.prototype.fetchCover = function(callback) {
  var that = this;
  QuestionsGeneratorHelper.getAlbum(this.albumId, function(albumData) {
    that.cover = albumData.images.LARGE.image_url;
    callback();
  });
};

GuessTrackNameQuestion.prototype.getJSON = function() {
  return {
    type: 'guess_track_name',
    name: this.trackName,
    spotify_id: this.trackId,
    others: this.others,
    cover: this.cover,
    answer: this.trackName
  }
}

var GuessAlbumYearQuestion = function(trackId, albumId) {
  this.trackId = trackId;
  this.albumId = albumId;
  this.others = null;
  this.year = null;
  this.cover = null;
};

GuessAlbumYearQuestion.prototype._getRandomYears = function(basedOnYear, amount) {
  var selectedYears = [];
  while (selectedYears.length < amount) {
    var maxDifference = 5;  //(+-5)
    var candidate = basedOnYear - maxDifference + ((Math.random() * maxDifference * 2) | 0);
    if (candidate != basedOnYear && selectedYears.indexOf(candidate) === -1 && candidate <= (new Date()).getFullYear()) {
      selectedYears.push(candidate);
    }
  }
  return selectedYears;
};

GuessAlbumYearQuestion.prototype.fetchAlbumInfo = function(callback) {
  var that = this;
  QuestionsGeneratorHelper.getAlbum(this.albumId, function(albumData) {
    that.albumId = albumData.id;
    that.year = albumData.release_year;
    that.others = that._getRandomYears(albumData.release_year, 2);
    that.cover = albumData.images.LARGE.image_url;
    callback();
  });
};

GuessAlbumYearQuestion.prototype.getJSON = function() {
  return {
    type: 'guess_album_year',
    spotify_id: this.albumId,
    others: this.others,
    cover: this.cover,
    year: this.year,
    answer: this.year
  }
};

var GuessTrackArtistQuestion = function(trackId, artistName) {
  this.trackId = trackId;
  this.artistName = artistName;
};

GuessTrackArtistQuestion.prototype.getJSON = function() {
  return {
    type: 'guess_track_artist',
    spotify_id: this.trackId,
    others: this.others,
    name: this.artistName,
    answer: this.artistName,
    others: this._getRandomArtist(this.artistName, 2)
  }
}

GuessTrackArtistQuestion.prototype._getRandomArtist = function(basedOnArtist, amount) {
  var selectedArtists = [];
  while (selectedArtists.length < amount) {
    var candidate = generator.getArtists()[(Math.random() * generator.getArtists().length) | 0];
    if (candidate != basedOnArtist && selectedArtists.indexOf(candidate) === -1) {
      selectedArtists.push(candidate);
    }
  }
  return selectedArtists;
};
