# newrelic-video-html5 [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
#### [New Relic](http://newrelic.com) video tracking for HTML5

## Requirements
This video monitor solutions works on top of New Relic's **Browser Agent**.

## Usage
Add **scripts** inside `dist` folder to your page.

> If `dist` folder is not included, run `npm i && npm run build` to build it.

```javascript
// <video id="myPlayer"></video>
nrvideo.Core.addTracker(new nrvideo.Html5Tracker('myPlayer'))
```

