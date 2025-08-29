[![Community Project header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Community_Project.png)](https://opensource.newrelic.com/oss-category/#community-project)

# New Relic Html5 Tracker

New Relic video tracking for Html5 Player.

## Requirements

This video monitor solutions works on top of New Relic's **Browser Agent**.

## Build

Install dependencies:

```
$ npm install
```

And build:

```
$ npm run build:dev
```

Or if you need a production build:

```
$ npm run build
```

## Usage

Load **scripts** inside `dist` folder into your page.

```html
<script src="../dist/newrelic-video-html5.min.js"></script>
```

```javascript

const options = {
        info: {
          beacon: 'bam.nr-data.net',
          licenseKey: 'NRBR-298f449004b949aad61',
          applicationID: '601579909',
          region: 'US',
        },
      };

new nrvideo.Html5Tracker(player, options));
```

## Release

- Create a PR.
- Once approved, Update the package version according to the semver rules.
- Update the CHANGELOG in the repo (all web repos have a changelog file).
- Create a github tag with the version.
