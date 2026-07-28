import Html5Tracker from '../tracker';
import VegaTracker from '../vegaTracker';

const exportedModule = require('../index');

describe('Html5Tracker Module Export', () => {
  it('should export Html5Tracker as default', () => {
    expect(exportedModule.default).toBe(Html5Tracker);
  });

  it('should export Html5Tracker as named export', () => {
    expect(exportedModule.Html5Tracker).toBe(Html5Tracker);
  });

  it('should export VegaTracker as named export', () => {
    expect(exportedModule.VegaTracker).toBe(VegaTracker);
  });
});
