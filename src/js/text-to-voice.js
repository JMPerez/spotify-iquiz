var TextToVoice = function() {

};

TextToVoice.prototype.say = function(text, callback) {
  var voices = speechSynthesis.getVoices();
  var ssu = new SpeechSynthesisUtterance();
  ssu.lang = 'en-UK';
  ssu.voice = voices[1];
  ssu.text = text;
  console.log(ssu);
  speechSynthesis.speak(ssu);
  console.log('Saying ' + text);
  if (callback) {
    ssu.onend = function() {
      console.log('Machine finished speaking');
      callback();
      ssu.onend = null;
      speechSynthesis.cancel();
    };
  }
}
