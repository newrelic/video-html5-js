import Html5Tracker from '../tracker';
import { version } from '../../package.json';
import nrvideo from '@newrelic/video-core';

// Mock HTML5 Video player
const createMockPlayer = () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 10,
  duration: 100,
  currentSrc: 'https://example.com/video.mp4',
  muted: false,
  videoHeight: 720,
  videoWidth: 1280,
  playbackRate: 1,
  autoplay: false,
  preload: 'auto',
  networkState: 2,
  readyState: 4,
  NETWORK_LOADING: 2,
  HAVE_FUTURE_DATA: 3,
  ima: {
    getAdsManager: jest.fn(() => ({
      getCuePoints: jest.fn(() => [0, 30, 60])
    }))
  }
});

describe('Html5Tracker', () => {
  let player;
  let tracker;

  beforeEach(() => {
    player = createMockPlayer();
    tracker = new Html5Tracker(player, {});
  });

  describe('Initialization', () => {
    it('should create an instance of Html5Tracker', () => {
      expect(tracker).toBeInstanceOf(Html5Tracker);
    });

    it('should set the player', () => {
      expect(tracker.player).toBe(player);
    });
  });

  describe('Tracker Information Methods', () => {
    it('should return correct tracker name', () => {
      expect(tracker.getTrackerName()).toBe('html5');
    });

    it('should return correct player name', () => {
      expect(tracker.getPlayerName()).toBe('HTML5');
    });

    it('should return correct player version', () => {
      expect(tracker.getPlayerVersion()).toBe(version);
    });

    it('should return correct instrumentation provider', () => {
      expect(tracker.getInstrumentationProvider()).toBe('New Relic');
    });

    it('should return correct instrumentation name', () => {
      expect(tracker.getInstrumentationName()).toBe('HTML5');
    });

    it('should return correct instrumentation version', () => {
      expect(tracker.getInstrumentationVersion()).toBe(version);
    });
  });

  describe('Player State Methods', () => {
    it('should return playhead position in milliseconds', () => {
      player.currentTime = 5.5;
      expect(tracker.getPlayhead()).toBe(5500);
    });

    it('should return duration in milliseconds', () => {
      player.duration = 120.75;
      expect(tracker.getDuration()).toBe(120750);
    });

    it('should return video source', () => {
      expect(tracker.getSrc()).toBe('https://example.com/video.mp4');
    });

    it('should return muted state', () => {
      player.muted = true;
      expect(tracker.isMuted()).toBe(true);

      player.muted = false;
      expect(tracker.isMuted()).toBe(false);
    });

    it('should return video height', () => {
      expect(tracker.getRenditionHeight()).toBe(720);
    });

    it('should return video width', () => {
      expect(tracker.getRenditionWidth()).toBe(1280);
    });

    it('should return playback rate', () => {
      player.playbackRate = 1.5;
      expect(tracker.getPlayrate()).toBe(1.5);
    });

    it('should return autoplay setting', () => {
      player.autoplay = true;
      expect(tracker.isAutoplayed()).toBe(true);
    });

    it('should return preload setting', () => {
      player.preload = 'metadata';
      expect(tracker.getPreload()).toBe('metadata');
    });
  });

  describe('Event Listener Registration', () => {
    it('should register all event listeners', () => {
      tracker.registerListeners();

      expect(player.addEventListener).toHaveBeenCalledWith('loadstart', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('loadeddata', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('canplay', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('play', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('playing', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('seeking', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('seeked', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('waiting', expect.any(Function));
    });

    it('should register ad-related event listeners', () => {
      tracker.registerListeners();

      expect(player.addEventListener).toHaveBeenCalledWith('adsready', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('adstart', expect.any(Function));
      expect(player.addEventListener).toHaveBeenCalledWith('adend', expect.any(Function));
    });

    it('should call debugCommonVideoEvents when registering listeners', () => {
      // Spy on nrvideo.Log.debugCommonVideoEvents
      const spy = jest.spyOn(nrvideo.Log, 'debugCommonVideoEvents');

      tracker.registerListeners();

      expect(spy).toHaveBeenCalledWith(player);

      // Clean up
      spy.mockRestore();
    });

    it('should unregister all event listeners', () => {
      tracker.registerListeners();
      tracker.unregisterListeners();

      expect(player.removeEventListener).toHaveBeenCalledWith('loadstart', expect.any(Function));
      expect(player.removeEventListener).toHaveBeenCalledWith('play', expect.any(Function));
      expect(player.removeEventListener).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(player.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
      expect(player.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      tracker.sendDownload = jest.fn();
      tracker.sendRequest = jest.fn();
      tracker.sendBufferEnd = jest.fn();
      tracker.sendResume = jest.fn();
      tracker.sendStart = jest.fn();
      tracker.sendPause = jest.fn();
      tracker.sendSeekStart = jest.fn();
      tracker.sendSeekEnd = jest.fn();
      tracker.sendError = jest.fn();
      tracker.sendEnd = jest.fn();
      tracker.sendBufferStart = jest.fn();
    });

    it('should handle download event', () => {
      const event = { type: 'loadstart' };
      tracker.onDownload(event);

      expect(tracker.sendDownload).toHaveBeenCalledWith({ state: 'loadstart' });
    });

    it('should handle play event', () => {
      tracker.onPlay();

      expect(tracker.sendRequest).toHaveBeenCalled();
    });

    it('should handle playing event', () => {
      tracker.onPlaying();

      expect(tracker.sendBufferEnd).toHaveBeenCalled();
      expect(tracker.sendResume).toHaveBeenCalled();
      expect(tracker.sendStart).toHaveBeenCalled();
    });

    it('should handle pause event', () => {
      tracker.onPause();

      expect(tracker.sendPause).toHaveBeenCalled();
    });

    it('should handle seeking event', () => {
      tracker.onSeeking();

      expect(tracker.sendSeekStart).toHaveBeenCalled();
    });

    it('should handle seeked event', () => {
      tracker.onSeeked();

      expect(tracker.sendSeekEnd).toHaveBeenCalled();
    });

    it('should handle ended event', () => {
      tracker.onEnded();

      expect(tracker.sendEnd).toHaveBeenCalled();
    });

    it('should handle error event with code and message', () => {
      const event = { code: 4, message: 'Media source not supported' };
      tracker.onError(event);

      expect(tracker.sendError).toHaveBeenCalledWith({
        errorCode: 4,
        errorMessage: 'Media source not supported'
      });
    });

    it('should handle error event without code', () => {
      const event = { type: 'error' };
      tracker.onError(event);

      expect(tracker.sendError).toHaveBeenCalledWith({ error: event });
    });

    it('should handle waiting event and send buffer start', () => {
      player.networkState = player.NETWORK_LOADING;
      player.readyState = 2; // Less than HAVE_FUTURE_DATA

      tracker.onWaiting();

      expect(tracker.sendBufferStart).toHaveBeenCalled();
    });

    it('should not send buffer start if network conditions are not met', () => {
      player.networkState = 1; // Not NETWORK_LOADING
      player.readyState = 2;

      tracker.onWaiting();

      expect(tracker.sendBufferStart).not.toHaveBeenCalled();
    });
  });

  describe('Ad Event Handlers', () => {
    beforeEach(() => {
      tracker.setAdsTracker = jest.fn();
      tracker.sendEnd = jest.fn();
    });

    it('should handle adstart event', () => {
      tracker.onAdStart();

      expect(tracker.currentAdPlaying).toBe(true);
      expect(tracker.imaAdCuePoints).toEqual([0, 30, 60]);
    });

    it('should handle adstart without setting cue points if already set', () => {
      tracker.imaAdCuePoints = [0, 15];
      tracker.onAdStart();

      expect(tracker.imaAdCuePoints).toEqual([0, 15]);
    });

    it('should handle adend event and send end if content is ended', () => {
      tracker.isContentEnd = true;
      tracker.onAdEnd();

      expect(tracker.sendEnd).toHaveBeenCalled();
    });

    it('should handle adend event without sending end if content is not ended', () => {
      tracker.isContentEnd = false;
      tracker.onAdEnd();

      expect(tracker.sendEnd).not.toHaveBeenCalled();
    });
  });
});
