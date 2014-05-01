var manager,
    renderer,
    textToVoice,
    reader,
    player,
    generator,
    spotifyWebApi;

var q;

// check why this doesn't sound
function guessProgress() {
  var askedQuestions = manager.getAskedQuestions();
  var score = manager.getScore();
  var ratio = score / askedQuestions;

  return ratio;
}

function loadNext() {

  var q = manager.getNext();
  if (q === null) {
    player.pause(function() {
      textToVoice.say('The game has finished! Your score is ' + manager.getScore() + ' points.');
      var template = Handlebars.compile(document.getElementById('template-game-end').innerHTML);
      document.getElementById('question').innerHTML = template({score: manager.getScore()});
    });
  } else {
    renderer.render(q);
    var question = q;
    player.pause(function() {
      reader.read(q, function() {
        player.play(question);
      });
    });
  }
}

document.getElementById('login').addEventListener('click', function() {
  login();
});

function login() {

  spotifyWebApi = new SpotifyWebApi();
  spotifyWebApi.setPromiseImplementation(Q);

  var importer = new SpotifyPlaylistsImporter();
  importer.login(function(accessToken) {
    importer.importPlaylists(accessToken, function(playlists) {
      init(playlists);
    });
  });
}

function init(playlists) {
  generator = new QuestionsGenerator(playlists);
  generator.load();

  var questions = generator.generateQuestions(function(questions) {
    manager = new QuestionsManager(questions);
    renderer = new QuestionRenderer();
    textToVoice = new TextToVoice();

    reader = new QuestionReader(textToVoice);
    player = new Player();

    document.getElementById('logged-in').style.display= 'block';
    document.getElementById('logged-out').style.display= 'none';

    manager.onUserResponse = function(isValid, validAnswer, userAnswer) {
      var extra = '';
      var ratio = guessProgress();
      var askedQuestions = manager.getAskedQuestions();
      player.goToVolume(0.1, function() {
        if (isValid) {
          if (ratio > 0.7 && askedQuestions > 0 && askedQuestions % 5 === 0) {
            extra = 'Oh dude, you know your stuff!';
          }
          var sentences = [
            'Great!',
            'Well done!',
            'Awesome!',
            'That\'s it! {0}.',
            'Right answer!',
            'You\'re right!',
            'Yes, it\'s {0}!',
            'Of course it is {0}.'
          ];
          var sentence = sentences[(Math.random()*sentences.length) | 0];
          sentence = sentence.replace('{0}', validAnswer);
          textToVoice.say(sentence + ' ' + extra, loadNext);
        } else {
          if (ratio <= 0.2 && askedQuestions > 0 && askedQuestions % 5 === 0) {
            extra += 'Did you create your own playlists? It seems you don\'t have a clue about your music';
          } else if (ratio <= 0.7 && askedQuestions > 0 && askedQuestions % 5 === 0) {
            extra = 'You are not doing very well. Keep improving!';
          }
          var sentences = [
            'Almost! It was {1}.',
            '{0}? Wrong answer! It is {1}.',
            'How can it be {0}? You\'re wrong! It\'s definitely {1}.',
            'That\'s wrong! It\'s {1}.'
          ];
          var sentence = sentences[(Math.random()*sentences.length) | 0];
          sentence = sentence.replace('{0}', userAnswer);
          sentence = sentence.replace('{1}', validAnswer);
          textToVoice.say(sentence + ' ' + extra, loadNext);
        }
      });
    };

    loadNext();
  });
}
