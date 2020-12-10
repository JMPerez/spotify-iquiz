var QuestionsGenerator = function (playlists) {
  this.playlists = playlists;
  this._tracks = [];
};

QuestionsGenerator.prototype.load = function () {
  var that = this;
  this._tracks = [];
  this.playlists.forEach(function (p) {
    if (p !== null) {
      that._tracks = that._tracks.concat(
        p.items.map(function (i) {
          return i.track;
        })
      );
    }
  });

  this._artists = {};
  this._tracks.forEach(function (t) {
    t.artists.forEach(function (a) {
      if (!(a.name in that._artists)) {
        that._artists[a.name] = 1;
      }
    });
  });

  this._artistsArray = Object.keys(this._artists);
};

QuestionsGenerator.prototype.getTracks = function () {
  return this._tracks;
};

QuestionsGenerator.prototype.getArtists = function () {
  return this._artistsArray;
};

QuestionsGenerator.prototype.generateQuestions = function (callback) {
  var questionTypes = [
    'guess_track_artist',
    'guess_track_name',
    'guess_album_year',
  ];

  var numberQuestions = 10;

  var questions = [];

  var that = this;

  // fetch album images for some tracks
  // // fetch album images for some tracks
  for (var i = 0; i < numberQuestions; i++) {
    // todo: check that this is not duplicated
    var questionType =
      questionTypes[(Math.random() * questionTypes.length) | 0];
    var track = this._tracks[(Math.random() * this._tracks.length) | 0];

    var question = null;
    switch (questionType) {
      case 'guess_track_artist':
        question = new GuessTrackArtistQuestion(
          track.id,
          track.artists[0].name,
          track.preview_url
        );
        break;
      case 'guess_album_year':
        question = new GuessAlbumYearQuestion(
          track.id,
          track.album.id,
          track.preview_url
        );
        break;
      case 'guess_track_name':
        question = new GuessTrackNameQuestion(
          track.name,
          track.id,
          track.album.id,
          track.preview_url
        );
        break;
    }

    if (question !== null) {
      questions.push(question);
    }
  }

  var promises = questions.map(function (q) {
    return q.fill();
  });

  Q.all(promises).then(function (results) {
    callback(results);
  });
};

QuestionsGenerator.prototype._cleanAndRandomize = function (questions) {
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
  return shuffled.map(function (q) {
    return q.getJSON();
  });
};

var GuessTrackNameQuestion = function (
  trackName,
  trackId,
  albumId,
  previewUrl
) {
  this.trackName = trackName;
  this.trackId = trackId;
  this.albumId = albumId;
  this.others = [];
  this.cover = null;
  this.previewUrl = previewUrl;
};

GuessTrackNameQuestion.prototype._getRandomTrackName = function (
  basedOnTrack,
  amount
) {
  var selectedTracks = [];
  while (selectedTracks.length < amount) {
    var candidate = generator.getTracks()[
      (Math.random() * generator.getTracks().length) | 0
    ].name;
    if (candidate != basedOnTrack && selectedTracks.indexOf(candidate) === -1) {
      selectedTracks.push(candidate);
    }
  }
  return selectedTracks;
};

GuessTrackNameQuestion.prototype._fetchCover = function () {
  var deferred = Q.defer();
  spotifyWebApi.getAlbum(this.albumId).then(function (albumData) {
    deferred.resolve(albumData.images[0].url);
  });
  return deferred.promise;
};

GuessTrackNameQuestion.prototype.fill = function () {
  var deferred = Q.defer();
  var that = this;
  this.others = this._getRandomTrackName(this.trackName, 2);
  this._fetchCover().then(function (cover) {
    that.cover = cover;
    deferred.resolve(that.getJSON());
  });
  return deferred.promise;
};

GuessTrackNameQuestion.prototype.getJSON = function () {
  return {
    type: 'guess_track_name',
    name: this.trackName,
    spotify_id: this.trackId,
    others: this.others,
    cover: this.cover,
    answer: this.trackName,
    previewUrl: this.previewUrl,
  };
};

var GuessAlbumYearQuestion = function (trackId, albumId, previewUrl) {
  this.trackId = trackId;
  this.albumId = albumId;
  this.others = null;
  this.year = null;
  this.cover = null;
  this.previewUrl = previewUrl;
};

GuessAlbumYearQuestion.prototype._getRandomYears = function (
  basedOnYear,
  amount
) {
  var selectedYears = [];
  while (selectedYears.length < amount) {
    var maxDifference = 5; //(+-5)
    var candidate =
      basedOnYear - maxDifference + ((Math.random() * maxDifference * 2) | 0);
    if (
      candidate != basedOnYear &&
      selectedYears.indexOf(candidate) === -1 &&
      candidate <= new Date().getFullYear()
    ) {
      selectedYears.push(candidate);
    }
  }
  return selectedYears;
};

GuessAlbumYearQuestion.prototype._fetchAlbumInfo = function (callback) {
  var that = this;
  spotifyWebApi.getAlbum(this.albumId).then(function (albumData) {
    that.albumId = albumData.id;
    that.year = +albumData.release_date.split('-')[0];
    that.others = that._getRandomYears(that.year, 2);
    that.cover = albumData.images[0].url;
    callback();
  });
};

GuessAlbumYearQuestion.prototype.getJSON = function () {
  return {
    type: 'guess_album_year',
    spotify_id: this.albumId,
    others: this.others,
    cover: this.cover,
    year: this.year,
    answer: this.year,
    previewUrl: this.previewUrl,
  };
};

GuessAlbumYearQuestion.prototype.fill = function () {
  var deferred = Q.defer();
  var that = this;
  this._fetchAlbumInfo(function () {
    deferred.resolve(that.getJSON());
  });
  return deferred.promise;
};

var GuessTrackArtistQuestion = function (trackId, artistName, previewUrl) {
  this.trackId = trackId;
  this.artistName = artistName;
  this.others = [];
  this.previewUrl = previewUrl;
};

GuessTrackArtistQuestion.prototype._getRandomArtist = function (
  basedOnArtist,
  amount
) {
  var selectedArtists = [];
  while (selectedArtists.length < amount) {
    var candidate = generator.getArtists()[
      (Math.random() * generator.getArtists().length) | 0
    ];
    if (
      candidate != basedOnArtist &&
      selectedArtists.indexOf(candidate) === -1
    ) {
      selectedArtists.push(candidate);
    }
  }
  return selectedArtists;
};

GuessTrackArtistQuestion.prototype.fill = function () {
  this.others = this._getRandomArtist(this.artistName, 2);
  var that = this;
  return Q.fcall(function () {
    return that.getJSON();
  });
};

GuessTrackArtistQuestion.prototype.getJSON = function () {
  return {
    type: 'guess_track_artist',
    spotify_id: this.trackId,
    name: this.artistName,
    answer: this.artistName,
    others: this.others,
    previewUrl: this.previewUrl,
  };
};
