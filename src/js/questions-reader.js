var QuestionReader = function (textToVoice) {
  this._textToVoice = textToVoice;
};

QuestionReader.prototype.read = function (question, callback) {
  switch (question.type) {
    case 'guess_album_year':
      var sentences = [
        'When was this album released?',
        "What's the release year of this album?",
        "I'm sure you know the year of this album",
        'Try to remember when this album was released.',
        'This album was released in what year?',
      ];

      var sentence = sentences[(Math.random() * sentences.length) | 0];
      this._textToVoice.say(sentence, function () {
        callback();
      });
      break;

    case 'guess_track_artist':
      var sentences = [
        'Who is the singer of this song?',
        'Who performs this song?',
        'Who is the artist?',
        "What's the artist of this masterpiece?",
      ];

      var sentence = sentences[(Math.random() * sentences.length) | 0];
      this._textToVoice.say(sentence, function () {
        callback();
      });
      break;

    case 'guess_track_name':
      var sentences = [
        "What's the name of this song?",
        'Can you guess the name of this song?',
        "I'm sure you know the name of this song",
        "You know the name of this song! Don't you?",
      ];

      var sentence = sentences[(Math.random() * sentences.length) | 0];
      this._textToVoice.say(sentence, function () {
        callback();
      });
      break;
  }
};
export default QuestionReader;
