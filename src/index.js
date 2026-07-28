import Html5Tracker from './tracker';

// Default export — preserves the existing customer-facing API:
//   import Html5Tracker from '@newrelic/video-html5';
export default Html5Tracker;

// Backwards-compat: pre-existing consumers do
// `require('@newrelic/video-html5').Html5Tracker` because the CJS bundle
// historically wrapped the entry under that name. Re-exposing it as a named
// export keeps that surface working now that webpack `library` is dropped.
export { default as Html5Tracker } from './tracker';


// New: Vega SDK tracker (Kepler / Fire TV class devices). Routes events
// through `@newrelic/video-core`'s connectedDeviceAnalyticsHarvester / ConnectedDeviceHarvester
// to the New Relic mobile collector.
export { default as VegaTracker } from './vegaTracker';
