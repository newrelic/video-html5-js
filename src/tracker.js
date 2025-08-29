import nrvideo from '@newrelic/video-core';
import pkg from '../package.json';

export default class Html5Tracker extends nrvideo.VideoTracker {
  constructor(player, options) {
    super(player, options);
    nrvideo.Core.addTracker(this, options);
  }
  getTrackerName() {
    return 'html5';
  }

  getPlayerName() {
    return 'HTML5';
  }

  getInstrumentationProvider() {
    return 'New Relic';
  }

  getInstrumentationName() {
    return this.getPlayerName();
  }

  getInstrumentationVersion() {
    return this.getPlayerVersion();
  }

  getPlayerVersion() {
    return pkg.version;
  }

  getPlayhead() {
    return this.player.currentTime * 1000;
  }

  getDuration() {
    return this.player.duration * 1000;
  }

  getSrc() {
    return this.player.currentSrc;
  }

  isMuted() {
    return this.player.muted;
  }

  getRenditionHeight() {
    return this.player.videoHeight;
  }

  getRenditionWidth() {
    return this.player.videoWidth;
  }

  getPlayrate() {
    return this.player.playbackRate;
  }

  isAutoplayed() {
    return this.player.autoplay;
  }

  getPreload() {
    return this.player.preload;
  }

  registerListeners() {
    nrvideo.Log.debugCommonVideoEvents(this.player);

    this.player.addEventListener('loadstart', this.onDownload.bind(this));
    this.player.addEventListener('loadedmetadata', this.onDownload.bind(this));
    this.player.addEventListener('loadeddata', this.onDownload.bind(this));
    this.player.addEventListener('canplay', this.onDownload.bind(this));
    this.player.addEventListener('play', this.onPlay.bind(this));
    this.player.addEventListener('playing', this.onPlaying.bind(this));
    this.player.addEventListener('pause', this.onPause.bind(this));
    this.player.addEventListener('seeking', this.onSeeking.bind(this));
    this.player.addEventListener('seeked', this.onSeeked.bind(this));
    this.player.addEventListener('error', this.onError.bind(this));
    this.player.addEventListener('ended', this.onEnded.bind(this));
    this.player.addEventListener('waiting', this.onWaiting.bind(this));
  }

  unregisterListeners() {
    this.player.removeEventListener('loadstart', this.onDownload);
    this.player.removeEventListener('loadedmetadata', this.onDownload);
    this.player.removeEventListener('loadeddata', this.onDownload);
    this.player.removeEventListener('canplay', this.onDownload);
    this.player.removeEventListener('play', this.onPlay);
    this.player.removeEventListener('playing', this.onPlaying);
    this.player.removeEventListener('pause', this.onPause);
    this.player.removeEventListener('seeking', this.onSeeking);
    this.player.removeEventListener('seeked', this.onSeeked);
    this.player.removeEventListener('error', this.onError);
    this.player.removeEventListener('ended', this.onEnded);
    this.player.removeEventListener('waiting', this.onWaiting);
  }

  onDownload(e) {
    this.sendDownload({ state: e.type });
  }

  onPlay() {
    this.sendRequest();
  }

  onPlaying() {
    this.sendBufferEnd();
    this.sendResume();
    this.sendStart();
  }

  onPause() {
    this.sendPause();
  }

  onSeeking() {
    this.sendSeekStart();
  }

  onSeeked() {
    this.sendSeekEnd();
  }

  onError(e) {
    // not getting errorcode and error message;
    const { code: errorCode, message: errorMessage } = e;
    if (errorCode || errorMessage) {
      this.sendError({ errorCode, errorMessage });
    } else {
      this.sendError({ error: e });
    }
  }

  onEnded() {
    this.sendEnd();
  }

  onWaiting() {
    if (
      this.player.networkState === this.player.NETWORK_LOADING &&
      this.player.readyState < this.player.HAVE_FUTURE_DATA
    ) {
      this.sendBufferStart();
    }
  }
}
