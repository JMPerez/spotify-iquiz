var QuestionRenderer = function() {
  this._templates = {};

  this._templates.guess_name = Handlebars.compile(
    document.getElementById('template-guess-name').innerHTML
  );

  this._templates.album = Handlebars.compile(
    document.getElementById('template-album').innerHTML
  );
}
QuestionRenderer.prototype.render = function(question) {
  var that = this;
  var questionPlaceholder = document.getElementById('question');
  switch (question.type) {
    case 'guess_album_year':
      var req = new XMLHttpRequest();
      req.open('GET', 'https://api.spotify.com/v1/albums/' + question.spotify_id, true);
      var that = this;
      req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
          var data = JSON.parse(req.responseText);
          questionPlaceholder.classList.add('fadeout');
          setTimeout(function() {
            questionPlaceholder.innerHTML = that._templates.album(
            {
              question: 'Guess the year of the album!',
              options: question.options,
              cover: data.images.LARGE.image_url,
              score: question.score,
              progress: question.progress
            });

            var buttons = questionPlaceholder.querySelectorAll('.button-response');
            for (var i = 0; i < buttons.length; i++) {
              buttons[i].addEventListener('click', function(e) {
                e.preventDefault();
                // todo: trigger event to decouple this
                manager.check(+this.getAttribute('data-index'));

              }, false);
            }
            questionPlaceholder.classList.remove('fadeout');
          }, 500);
        }
      };
      req.send(null);
      break;

    case 'guess_track_name':
      questionPlaceholder.classList.add('fadeout');
      setTimeout(function() {
        questionPlaceholder.innerHTML = that._templates.guess_name(
        {
          question: 'Guess the name of the song!',
          options: question.options,
          score: question.score,
          cover: question.cover,
          progress: question.progress
        });

        var buttons = questionPlaceholder.querySelectorAll('.button-response');
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].addEventListener('click', function(e) {
            e.preventDefault();
            // todo: trigger event to decouple this
            manager.check(+this.getAttribute('data-index'));

          }, false);
        }
        questionPlaceholder.classList.remove('fadeout');
      }, 500);
      break;

    case 'guess_track_artist':
      questionPlaceholder.classList.add('fadeout');
        setTimeout(function() {
        questionPlaceholder.innerHTML = that._templates.guess_name(
        {
          question: 'Guess the name of the artist!',
          options: question.options,
          score: question.score,
          cover: 'img/album_placeholder-blank.png',
          progress: question.progress
        });

        var buttons = questionPlaceholder.querySelectorAll('.button-response');
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].addEventListener('click', function(e) {
            e.preventDefault();
            // todo: trigger event to decouple this
            manager.check(+this.getAttribute('data-index'));

          }, false);
        }
        questionPlaceholder.classList.remove('fadeout');
      }, 500);
  }
};