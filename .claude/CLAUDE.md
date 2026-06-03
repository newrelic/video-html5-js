# New Relic HTML5 Video Tracker - Codebase Guide

## Project Overview

**Name:** @newrelic/video-html5
**Purpose:** JavaScript library providing video analytics for HTML5 `<video>` elements, tracking events, monitoring playback quality, and identifying errors for New Relic.
**License:** Apache 2.0
**Current Version:** 4.1.1

### Key Features
- Automatic HTML5 video event detection
- Quality of Experience (QoE) metrics aggregation
- Event segregation: VideoAction, VideoErrorAction, VideoCustomAction
- Google IMA Ad support
- Multi-format distribution (UMD, CommonJS, ES Modules)

## Directory Structure

```
├── src/                          # Source code
│   ├── index.js                  # Entry point, exports Html5Tracker
│   ├── tracker.js                # Main Html5Tracker class
│   └── ads/
│       └── ima.js                # IMA ads tracker
├── dist/                         # Built artifacts (generated)
│   ├── umd/                      # Browser global
│   ├── cjs/                      # CommonJS (Node.js/require)
│   └── esm/                      # ES Module (modern import)
├── samples/                      # Example implementations
├── .github/workflows/            # CI/CD automation
├── package.json                  # Project metadata and scripts
├── webpack.config.js             # Build configuration (3-output config)
└── DATAMODEL.md                  # Data schema specification
```

## Architecture

### Inheritance Hierarchy
```
VideoTracker (from @newrelic/video-core)
  ├── Html5Tracker (main tracker for native HTML5 video)
  └── Html5ImaAdsTracker (specialized tracker for Google IMA ads)
```

The tracker extends `VideoTracker` from `@newrelic/video-core`, which handles:
- Event serialization and data model management
- Event aggregation and harvesting
- Communication with New Relic servers
- State machine transitions

### Event Listener Pattern
1. Registers native HTML5 video element event listeners
2. Maps HTML5 events to tracker methods (e.g., `playing` → `onPlaying()`)
3. Tracker methods call inherited `send*()` methods from VideoTracker
4. VideoTracker base class handles event creation, aggregation, and transmission

## Key Files

### `/src/tracker.js` - Main Implementation

**Class:** `Html5Tracker extends nrvideo.VideoTracker`

**Important Methods:**
- **Getters:** `getPlayhead()`, `getDuration()`, `getSrc()`, `isMuted()`, etc.
- **Event Handlers:** `onPlay()`, `onPlaying()`, `onPause()`, `onWaiting()`, etc.

**Event Listeners (26 events):**
- Download: `loadstart`, `loadedmetadata`, `loadeddata`, `canplay`
- Playback: `play`, `playing`, `pause`
- Seek: `seeking`, `seeked`
- Buffer: `waiting`
- Completion: `ended`
- Error: `error`

### `/src/ads/ima.js` - IMA Ad Tracker

**Class:** `Html5ImaAdsTracker extends nrvideo.VideoTracker`

Handles Google IMA ad events: LOADED, STARTED, PAUSED, RESUMED, COMPLETE, SKIPPED, CLICK, quartiles, errors.

## Buffering Event Handling

### Buffer Start Detection
```javascript
onWaiting() {
  if (
    this.player.networkState === this.player.NETWORK_LOADING &&
    this.player.readyState < this.player.HAVE_FUTURE_DATA
  ) {
    this.sendBufferStart();
  }
}
```

### Buffer End Detection
```javascript
onPlaying() {
  this.sendBufferEnd();
  this.sendResume();
  this.sendStart();
}
```

**Key Issue:** Buffer end is only detected when `playing` event fires, not when buffer actually fills. This causes problems when user pauses during buffering.

## Build Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Production build (all 3 formats) |
| `npm run build:dev` | Development build with readable output |
| `npm run watch` | Watch mode (production) |
| `npm run watch:dev` | Watch mode (development) |
| `npm run clean` | Remove dist/ and .zip files |

## Data Model

### Event Categories
1. **VideoAction** - General playback events (CONTENT_START, CONTENT_END, etc.)
2. **VideoErrorAction** - Error events
3. **VideoAdAction** - Ad-specific events
4. **VideoCustomAction** - User-defined events

### Time Units
**All time values are in milliseconds.** Convert from HTML5 seconds:
```javascript
getPlayhead() {
  return this.player.currentTime * 1000;
}
```

## Common Development Tasks

### Adding a New HTML5 Event

1. Add listener in `registerListeners()`:
```javascript
this.player.addEventListener('eventname', this.onEventName);
```

2. Add unregistration in `unregisterListeners()`:
```javascript
this.player.removeEventListener('eventname', this.onEventName);
```

3. Create handler:
```javascript
onEventName(e) {
  this.sendX({ /* details */ });
}
```

### Sending Events
Use inherited methods from VideoTracker:
- `sendStart()`, `sendEnd()`, `sendPause()`, `sendResume()`
- `sendBufferStart()`, `sendBufferEnd()`
- `sendSeekStart()`, `sendSeekEnd()`
- `sendDownload()`, `sendError()`, `sendCustom()`

## Key Dependencies

- **@newrelic/video-core** (^4.0.0) - Core video tracking library providing VideoTracker base class
- **webpack** (^5.91.0) - Module bundler
- **@babel/core** (^7.24.5) - Transpiler

## Release Process

Uses semantic-release with conventional commits:
- `feat:` → Minor version
- `fix:`, `perf:`, `revert:` → Patch version
- Breaking changes → Major version

## Important Notes

1. **Buffer events limitation:** HTML5 `waiting` event is unreliable across browsers
2. **IMA detection:** Requires both `player.ima` and `google.ima` to be loaded
3. **State machine:** VideoTracker base class guards against duplicate events (e.g., `goBufferEnd()`)
4. **Testing:** Open `samples/webm.html` in browser after building to test integration
