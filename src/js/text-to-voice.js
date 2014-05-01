var TextToVoice = function() {
};

TextToVoice.prototype.say = function(text, callback) {

  // for some reason firefox reports speechSynthesis to be an object but it's not compatible with the
  // polyfill for the utterance
  var fallbackSpeechSynthesis = window.SpeechSynthesisUtterance ? window.speechSynthesis : window.speechSynthesisPolyfill;
  var fallbackSpeechSynthesisUtterance = window.SpeechSynthesisUtterance || window.SpeechSynthesisUtterancePolyfill;

  var u = new fallbackSpeechSynthesisUtterance(text);
  u.lang = 'en-UK';
  if (callback) {
    u.onend = function(event) {
      callback();
      u.onend = null;
      fallbackSpeechSynthesis.cancel();
    };
  }
  fallbackSpeechSynthesis.speak(u);
};
