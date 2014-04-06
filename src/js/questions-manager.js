
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

var QuestionsManager = function(q) {
  this.questions = q;
  this.currentQuestion = -1;
  this.score = 0;
}

QuestionsManager.prototype.getScore = function() {
  return this.score;
};

QuestionsManager.prototype.getAskedQuestions = function() {
  return this.currentQuestion + 1;
};

QuestionsManager.prototype.getNext = function() {
  this.currentQuestion++;
  if (this.currentQuestion < this.questions.length) {
    var current = this.questions[this.currentQuestion];
    current.score = this.score;
    current.progress = 100 * (this.getAskedQuestions() -1) / this.questions.length;

    switch (current.type) {
      case 'guess_album_year': {
        current.options = shuffleArray([current.year].concat(current.others));
        break;
      }
      case 'guess_track_artist':
      case 'guess_track_name': {
        current.options = shuffleArray([current.name].concat(current.others));
        break;
      }
    }
    console.log('Next question is', current);
    return current;
  } else {
    return null;
  }
};

QuestionsManager.prototype.check = function(response) {
  var current = this.questions[this.currentQuestion];
  if (current.options[response] === current.answer) {
    this.score++;
    if (this.onUserResponse) {
      this.onUserResponse(true, current.answer);
    }
  } else {
    if (this.onUserResponse) {
      this.onUserResponse(false, current.answer, current.options[response]);
    }
  }
}

QuestionsManager.prototype.onUserResponse = null;
