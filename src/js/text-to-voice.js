var TextToVoice = function() {
  this.ssu = new SpeechSynthesisUtterance();
  this.ssu.lang = 'en-UK';
};

TextToVoice.prototype.say = function(text, callback) {
  this.ssu.text = text;
  speechSynthesis.speak(this.ssu);
  console.info('Saying ' + text);
  var that = this;
  if (callback) {
    this.ssu.onend = function() {
      callback();
      that.ssu.onend = null;
      speechSynthesis.cancel();
    };
  }
};
