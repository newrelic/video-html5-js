import pkg from '../package.json';
import Html5Tracker from './tracker';
import { getRegisteredHarvester } from '@newrelic/video-core';

/**
 * VegaTracker — HTML5 tracker for the Amazon Vega SDK
 * (Kepler / Fire TV class devices).
 *
 * Structurally identical to Html5Tracker with one extra step: injects
 * `src: 'Vega'` via the `super` spread. That single field flows through:
 *   (a) `VideoTracker.setOptions` -> `this._src` -> `getAttributes`
 *       -> `att.src = 'Vega'` on every event.
 *   (b) `Core.addTracker` -> `setVideoConfig(info, config, 'Vega')`
 *       -> Vega-side global setup in `@newrelic/video-core`.
 *
 * The harvester is owned by `@newrelic/video-core/connectedDeviceAgent.js` as a module
 * singleton (`connectedDeviceAnalyticsHarvester`) — this class never constructs or
 * touches a harvester directly. Routing decisions happen inside
 * `recordEvent.js` based on `att.src`.
 *
 * Mirrors `VegaTracker` from `@newrelic/video-videojs`. Customers pick the
 * right package for their player; both ship the same `att.src='Vega'`
 * contract to the mobile collector.
 *
 * @example
 * import { VegaTracker } from '@newrelic/video-html5';
 *
 * const tracker = new VegaTracker(htmlMediaElement, {
 *   info: {
 *     accountId: '<NR account id>',
 *     applicationToken: '<NR app token>',
 *     endpoint: 'US' // 'US' | 'EU' | 'staging'
 *   },
 *   config: {
 *     qoeAggregate: true,
 *     qoeIntervalFactor: 5
 *   }
 * });
 */
export default class VegaTracker extends Html5Tracker {
  constructor(player, options) {
    // Single src injection. The class always wins; a customer-supplied
    // options.src is silently overwritten.
    super(player, { ...options, src: 'Vega' });
  }

  /**
   * Look up the Vega harvester from core's registry. `connectedDeviceAgent.js`
   * self-registers under 'Vega' as a side effect of being statically
   * imported by core's main and `/vega` entries — so `getRegisteredHarvester('Vega')`
   * returns the live singleton in any build that includes the Vega chain
   * and `undefined` otherwise. Using the registry instead of importing the
   * binding directly keeps this file alias-safe in webpack `/browser` builds
   * (where it is unreachable but `tracker.js` would still need to compile).
   */
  getHarvester() {
    return getRegisteredHarvester('Vega');
  }

  getTrackerName() {
    return 'vega-html5';
  }

  getTrackerVersion() {
    return pkg.version;
  }

  /**
   * Strip browser-only fields that may appear via Kepler's polyfills.
   * `att.src = 'Vega'` is set by the inherited `VideoTracker.getAttributes`
   * via `this._src`, not here.
   */
  getAttributes(att, eventType) {
    att = super.getAttributes(att, eventType);
    delete att.pageUrl;
    delete att.isBackgroundEvent;
    return att;
  }
}
