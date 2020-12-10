var Player = function () {
  this._audioObject = null;
};

Player.prototype.play = function (question) {
  var that = this;
  that.pause(function () {
    that._audioObject = new Audio(question.previewUrl);
    that._audioObject.volume = 0;
    that._audioObject.play();
    that.goToVolume(0.5);
  });
};

Player.prototype.pause = function (callback) {
  this.goToVolume(0, callback);
};

Player.prototype.goToVolume = function (targetVolume, callback) {
  var that = this;
  if (this._audioObject !== null) {
    var interval = setInterval(function () {
      if (that._audioObject.volume > targetVolume) {
        that._audioObject.volume = Math.max(
          that._audioObject.volume - 0.1,
          targetVolume
        );
      } else {
        that._audioObject.volume = Math.min(
          that._audioObject.volume + 0.1,
          targetVolume
        );
      }
      if (that._audioObject.volume === targetVolume) {
        clearInterval(interval);
        if (callback) {
          callback();
        }
      }
    }, 100);
  } else {
    callback();
  }
};
