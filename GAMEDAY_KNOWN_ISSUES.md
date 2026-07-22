# Known issue: rendition-change KPIs are not detectable via `samples/gameday-test.html`

Found during QOE 1.1 game day testing (2026-07-22). Confirmed via a real
headless-browser run of `samples/gameday-test.html`'s TC1 button: after a
scripted sequence of `hls.currentLevel` changes (low → mid → top → mid,
confirmed via console logs that each assignment executed), the resulting
`QOE_AGGREGATE` event showed `totalSwitchUps: 0`, `totalSwitchDowns: 0`, and
`totalRenditions: 2` (expected 2 / 1 / 3). Pause, startup, and playtime KPIs
in the same event were all correct.

## Root cause

`src/tracker.js` never listens for the native `<video>` element's `resize`
event, and never calls the core SDK's `sendRenditionChanged()` (see
`node_modules/@newrelic/video-core/src/videotracker.js:897`,
`sendRenditionChanged(att)`, which emits `CONTENT_RENDITION_CHANGE` and
feeds the QoE switch-up/switch-down/rendition-count KPIs). `tracker.js` only
reads `this.player.videoWidth`/`videoHeight` as one-shot getters elsewhere
(e.g. at content start) — it has no code path that detects a *change* in
rendition during playback and reports it.

This means: **no rendition-change KPI (`totalSwitchUps`, `totalSwitchDowns`,
`totalRenditions` beyond the initial 1, and by extension `avgDownloadRate`/
`minDownloadRate`/`maxDownloadRate` which only populate once a rendition
change triggers a download-rate sample) can currently be produced by this
tracker**, regardless of whether the underlying player does real adaptive
bitrate switching (native HLS in Safari, or `hls.js` as used in
`gameday-test.html`). This is a gap in the tracker itself, not specific to
the game day test harness or to `hls.js`.

## Suggested fix (not implemented here — this is a note, not a patch)

Add a `resize` event listener in `src/tracker.js` (native `<video>` elements
fire `resize` whenever `videoWidth`/`videoHeight` actually change) that
calls the existing `sendRenditionChanged()` API with the new dimensions.
This is core tracking behavior, not test-harness code, so it's out of scope
for the gameday branch's test-only changes — flagging for the team to
decide whether/when to fix in the actual SDK.
