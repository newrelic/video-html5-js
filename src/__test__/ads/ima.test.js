import Html5ImaAdsTracker from '../../ads/ima';
import { version } from '../../../package.json';

// Mock self for browser environment
global.self = global;

// Mock Google IMA SDK
global.google = {
  ima: {
    VERSION: '3.500.0',
    AdEvent: {
      Type: {
        LOADED: 'loaded',
        STARTED: 'started',
        PAUSED: 'paused',
        RESUMED: 'resumed',
        COMPLETE: 'complete',
        SKIPPED: 'skipped',
        CLICK: 'click',
        FIRST_QUARTILE: 'firstQuartile',
        MIDPOINT: 'midpoint',
        THIRD_QUARTILE: 'thirdQuartile',
        ALL_ADS_COMPLETED: 'allAdsCompleted',
        LINEAR_CHANGED: 'linearChanged',
        USER_CLOSE: 'userClose',
        CONTENT_PAUSE_REQUESTED: 'contentPauseRequested',
        CONTENT_RESUME_REQUESTED: 'contentResumeRequested',
        SKIPPABLE_STATE_CHANGED: 'skippableStateChanged',
        AD_CAN_PLAY: 'adCanPlay',
        AD_METADATA: 'adMetadata',
        EXPANDED_CHANGED: 'expandedChanged',
        AD_BREAK_READY: 'adBreakReady',
        LOG: 'log'
      }
    },
    AdErrorEvent: {
      Type: {
        AD_ERROR: 'adError'
      }
    }
  }
};

const createMockAd = (overrides = {}) => ({
  getAdId: jest.fn(() => overrides.adId || 'ad-123'),
  getCreativeId: jest.fn(() => overrides.creativeId || 'creative-456'),
  getDuration: jest.fn(() => overrides.duration || 30),
  getMediaUrl: jest.fn(() => overrides.mediaUrl || 'https://example.com/ad.mp4'),
  getTitle: jest.fn(() => overrides.title || 'Sample Ad'),
  getAdPodInfo: jest.fn(() => ({
    data: overrides.podInfo || {
      podIndex: 0,
      totalAds: 1,
      adPosition: 1
    }
  }))
});

const createMockAdsManager = (ad = createMockAd()) => ({
  getCurrentAd: jest.fn(() => ad),
  getCuePoints: jest.fn(() => [0, 30, 60]),
  getRemainingTime: jest.fn(() => 15)
});

const createMockPlayer = (adsManager = createMockAdsManager()) => ({
  muted: false,
  playbackRate: 1,
  ima: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getAdsManager: jest.fn(() => adsManager)
  }
});

describe('Html5ImaAdsTracker', () => {
  let player;
  let tracker;
  let adsManager;

  beforeEach(() => {
    adsManager = createMockAdsManager();
    player = createMockPlayer(adsManager);
    tracker = new Html5ImaAdsTracker(player, {});
  });

  describe('Static Methods', () => {
    it('should detect IMA usage when player has ima and google is defined', () => {
      const mockPlayer = { ima: {} };
      expect(Html5ImaAdsTracker.isUsing(mockPlayer)).toBe(true);
    });

    it('should return falsy when player does not have ima', () => {
      const mockPlayer = {};
      expect(Html5ImaAdsTracker.isUsing(mockPlayer)).toBeFalsy();
    });
  });

  describe('Tracker Information Methods', () => {
    it('should return correct tracker name', () => {
      expect(tracker.getTrackerName()).toBe('ima-ads');
    });

    it('should return correct tracker version', () => {
      expect(tracker.getTrackerVersion()).toBe(version);
    });

    it('should return correct player name', () => {
      expect(tracker.getPlayerName()).toBe('html5-ads');
    });

    it('should return correct player version with IMA version', () => {
      expect(tracker.getPlayerVersion()).toBe('ima: 3.500.0');
    });

    it('should return ad partner as ima', () => {
      expect(tracker.getAdPartner()).toBe('ima');
    });
  });

  describe('Player State Methods', () => {
    it('should return muted state from player', () => {
      player.muted = true;
      expect(tracker.isMuted()).toBe(true);

      player.muted = false;
      expect(tracker.isMuted()).toBe(false);
    });

    it('should return playback rate from player', () => {
      player.playbackRate = 1.5;
      expect(tracker.getPlayrate()).toBe(1.5);
    });

    it('should return cue points from ads manager', () => {
      expect(tracker.getCuePoints()).toEqual([0, 30, 60]);
    });
  });

  describe('Ad Data Methods', () => {
    beforeEach(() => {
      tracker.lastAdData = {
        adId: 'ad-789',
        creativeId: 'creative-xyz',
        duration: 45,
        mediaUrl: 'https://example.com/test-ad.mp4',
        title: 'Test Ad Title',
        podInfo: {
          podIndex: 1,
          totalAds: 2,
          adPosition: 1
        }
      };
    });

    it('should return ad ID from last ad data', () => {
      expect(tracker.getVideoId()).toBe('ad-789');
    });

    it('should return null when no ad data', () => {
      tracker.lastAdData = null;
      expect(tracker.getVideoId()).toBeNull();
    });

    it('should return creative ID from last ad data', () => {
      expect(tracker.getAdCreativeId()).toBe('creative-xyz');
    });

    it('should return ad duration in milliseconds', () => {
      expect(tracker.getDuration()).toBe(45000);
    });

    it('should return ad source URL', () => {
      expect(tracker.getSrc()).toBe('https://example.com/test-ad.mp4');
    });

    it('should return ad title', () => {
      expect(tracker.getTitle()).toBe('Test Ad Title');
    });
  });

  describe('Ad Position Detection', () => {
    it('should return "pre" for preroll ads (podIndex = 0)', () => {
      tracker.lastAdData = {
        podInfo: { podIndex: 0 }
      };
      expect(tracker.getAdPosition()).toBe('pre');
    });

    it('should return "mid" for midroll ads (podIndex > 0)', () => {
      tracker.lastAdData = {
        podInfo: { podIndex: 1 }
      };
      expect(tracker.getAdPosition()).toBe('mid');
    });

    it('should return "post" for postroll ads (podIndex = -1)', () => {
      tracker.lastAdData = {
        podInfo: { podIndex: -1 }
      };
      expect(tracker.getAdPosition()).toBe('post');
    });

    it('should return null when no pod info', () => {
      tracker.lastAdData = null;
      expect(tracker.getAdPosition()).toBeNull();
    });
  });

  describe('Playhead Calculation', () => {
    it('should calculate playhead based on duration and remaining time', () => {
      tracker.lastAdData = { duration: 30 };
      adsManager.getRemainingTime.mockReturnValue(15);

      const playhead = tracker.getPlayhead();

      // getDuration() returns 30000ms, remaining is 15s
      // playhead = (30000 - 15) * 1000 = 29985000ms
      expect(playhead).toBe(29985000);
    });
  });

  describe('Event Listener Registration', () => {
    it('should register all IMA event listeners', () => {
      tracker.registerListeners();

      expect(player.ima.addEventListener).toHaveBeenCalledWith('loaded', expect.any(Function));
      expect(player.ima.addEventListener).toHaveBeenCalledWith('started', expect.any(Function));
      expect(player.ima.addEventListener).toHaveBeenCalledWith('paused', expect.any(Function));
      expect(player.ima.addEventListener).toHaveBeenCalledWith('resumed', expect.any(Function));
      expect(player.ima.addEventListener).toHaveBeenCalledWith('complete', expect.any(Function));
      expect(player.ima.addEventListener).toHaveBeenCalledWith('skipped', expect.any(Function));
      expect(player.ima.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should register quartile event listeners', () => {
      tracker.registerListeners();

      expect(player.ima.addEventListener).toHaveBeenCalledWith('firstQuartile', expect.any(Function));
      expect(player.ima.addEventListener).toHaveBeenCalledWith('midpoint', expect.any(Function));
      expect(player.ima.addEventListener).toHaveBeenCalledWith('thirdQuartile', expect.any(Function));
    });

    it('should register error event listener', () => {
      tracker.registerListeners();

      expect(player.ima.addEventListener).toHaveBeenCalledWith('adError', expect.any(Function));
    });

    it('should unregister all event listeners', () => {
      tracker.registerListeners();
      tracker.unregisterListeners();

      expect(player.ima.removeEventListener).toHaveBeenCalledWith('loaded', expect.any(Function));
      expect(player.ima.removeEventListener).toHaveBeenCalledWith('started', expect.any(Function));
      expect(player.ima.removeEventListener).toHaveBeenCalledWith('complete', expect.any(Function));
    });

    it('should clear ad data when unregistering', () => {
      tracker.lastAdData = { adId: 'test' };
      tracker.unregisterListeners();

      expect(tracker.lastAdData).toBeNull();
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      tracker.sendRequest = jest.fn();
      tracker.sendStart = jest.fn();
      tracker.sendEnd = jest.fn();
      tracker.sendError = jest.fn();
      tracker.sendAdClick = jest.fn();
      tracker.sendAdQuartile = jest.fn();
      tracker.sendPause = jest.fn();
      tracker.sendResume = jest.fn();
      tracker.getAdData = jest.fn(() => ({
        adId: 'ad-123',
        creativeId: 'creative-456',
        duration: 30,
        mediaUrl: 'https://example.com/ad.mp4',
        title: 'Sample Ad'
      }));
    });

    it('should handle loaded event', () => {
      tracker.onLoaded();

      expect(tracker.getAdData).toHaveBeenCalled();
      expect(tracker.lastAdData).toBeTruthy();
      expect(tracker.sendRequest).toHaveBeenCalled();
    });

    it('should handle start event', () => {
      tracker.onStart();

      expect(tracker.getAdData).toHaveBeenCalled();
      expect(tracker.lastAdData).toBeTruthy();
      expect(tracker.sendStart).toHaveBeenCalled();
    });

    it('should handle complete event', () => {
      tracker.lastAdData = { adId: 'test' };
      tracker.onComplete();

      expect(tracker.sendEnd).toHaveBeenCalled();
      expect(tracker.lastAdData).toBeNull();
    });

    it('should handle skipped event', () => {
      tracker.lastAdData = { adId: 'test' };
      tracker.onSkipped();

      expect(tracker.sendEnd).toHaveBeenCalledWith({ skipped: true });
      expect(tracker.lastAdData).toBeNull();
    });

    it('should handle click event', () => {
      tracker.onClick();

      expect(tracker.sendAdClick).toHaveBeenCalled();
    });

    it('should handle first quartile event', () => {
      tracker.onFirstQuartile();

      expect(tracker.sendAdQuartile).toHaveBeenCalledWith({ adQuartile: 1 });
    });

    it('should handle midpoint event', () => {
      tracker.onMidpoint();

      expect(tracker.sendAdQuartile).toHaveBeenCalledWith({ adQuartile: 2 });
    });

    it('should handle third quartile event', () => {
      tracker.onThirdQuartile();

      expect(tracker.sendAdQuartile).toHaveBeenCalledWith({ adQuartile: 3 });
    });

    it('should handle paused event', () => {
      tracker.onPaused();

      expect(tracker.sendPause).toHaveBeenCalled();
    });

    it('should handle resumed event', () => {
      tracker.onResumed();

      expect(tracker.sendResume).toHaveBeenCalled();
    });

    it('should handle error event', () => {
      const mockError = {
        getError: jest.fn(() => ({
          getErrorCode: jest.fn(() => 1005),
          getMessage: jest.fn(() => 'Ad request failed')
        }))
      };

      tracker.onError(mockError);

      expect(tracker.sendError).toHaveBeenCalledWith({
        adError: expect.any(Object),
        errorCode: 1005,
        errorMessage: 'Ad request failed'
      });
    });
  });

  describe('getAdData', () => {
    it('should extract ad data from current ad', () => {
      const mockAd = createMockAd({
        adId: 'extracted-ad-id',
        title: 'Extracted Title'
      });
      adsManager.getCurrentAd.mockReturnValue(mockAd);

      // Call the real implementation
      tracker.getAdData = Html5ImaAdsTracker.prototype.getAdData;
      const adData = tracker.getAdData();

      expect(adData.adId).toBe('extracted-ad-id');
      expect(adData.title).toBe('Extracted Title');
    });

    it('should return null when ads manager is not available', () => {
      player.ima.getAdsManager.mockReturnValue(null);

      tracker.getAdData = Html5ImaAdsTracker.prototype.getAdData;
      const adData = tracker.getAdData();

      expect(adData).toBeNull();
    });

    it('should return null when getCurrentAd returns null', () => {
      adsManager.getCurrentAd.mockReturnValue(null);

      tracker.getAdData = Html5ImaAdsTracker.prototype.getAdData;
      const adData = tracker.getAdData();

      expect(adData).toBeNull();
    });

    it('should handle exceptions and return null', () => {
      player.ima.getAdsManager.mockImplementation(() => {
        throw new Error('Test error');
      });

      tracker.getAdData = Html5ImaAdsTracker.prototype.getAdData;
      const adData = tracker.getAdData();

      expect(adData).toBeNull();
    });
  });
});
