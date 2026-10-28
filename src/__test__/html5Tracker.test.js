import Html5Tracker from '../tracker';

jest.mock('@newrelic/video-core', () => ({
  __esModule: true,
  default: {
    VideoTracker: class VideoTracker {
      constructor(player, options) {
        this.player = player;
      }
    },
    Core: { addTracker: jest.fn() },
    Log: { debugCommonVideoEvents: jest.fn() },
  },
  getRegisteredHarvester: jest.fn(),
}));

const makePlayer = (currentSrc) => ({
  currentSrc,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
});

describe('Html5Tracker.getSrc()', () => {
  it('returns null for blob URLs', () => {
    const tracker = new Html5Tracker(makePlayer('blob:http://localhost:9000/abc'), {});
    expect(tracker.getSrc()).toBeNull();
  });

  it('returns the URL unchanged for https URLs', () => {
    const tracker = new Html5Tracker(makePlayer('https://example.com/stream.m3u8'), {});
    expect(tracker.getSrc()).toBe('https://example.com/stream.m3u8');
  });

  it('returns undefined when currentSrc is undefined', () => {
    const tracker = new Html5Tracker(makePlayer(undefined), {});
    expect(tracker.getSrc()).toBeUndefined();
  });

  it('returns empty string when currentSrc is empty string', () => {
    const tracker = new Html5Tracker(makePlayer(''), {});
    expect(tracker.getSrc()).toBe('');
  });
});
