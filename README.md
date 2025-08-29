[![Community Project header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Community_Project.png)](https://opensource.newrelic.com/oss-category/#community-project)

# New Relic Html5 Tracker Agent

The New Relic Html5 Tracker enhances your media applications by tracking video events, playback errors, and other activities, providing comprehensive insights into performance and user interactions.

- The Html5 tracker is available as a ready-to-use JavaScript snippet for easy copy-paste integration.
- New Relic Html5 tracker auto-detects events emitted by Html5 Player.
- For questions and feedback on this package, please visit the [Explorer's Hub](https://discuss.newrelic.com), New Relic's community support forum.
- Looking to contribute to the Player Name agent code base? See [DEVELOPING.md](./DEVELOPING.md) for instructions on building and testing the browser agent library, and Contributors.

## Adding The Html5 Tracker To Your Project

To integrate New Relic Tracker Agent into your web application effectively, Below is a guide on how to do this within your HTML file, if you want to with snippet code

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Relic Tracker Integration</title>

    <!-- snippet code generated get it from new relic onboarding steps -->
    <script src="path/to/Html5-tracker.js"></script>
  </head>
  <body>
    <!-- Your HTML content -->
  </body>
</html>
```

## Adding the agent package to your project

To make the tracker available to your application, install via [NPM](https://docs.npmjs.com/cli/v8/commands/npm-install) or [Yarn](https://classic.yarnpkg.com/lang/en/docs/cli/install/).

```shell
$ npm install @newrelic/video-html5
```

```shell
$ yarn add @newrelic/video-html5
```

## Instantiating the Html5 Tracker

```javascript
// Add import statement
import Html5Tracker from '@newrelic/video-html5';

// Get Application info from onboarding steps of new relic, from tiles Place a JavaScript Snippet Code
const options = {
  info: {
    beacon: 'xxxxxxxxxx',
    applicationID: 'xxxxxxx',
    licenseKey: 'xxxxxxxxxxx',
  },
};

// Add a Html5Tracker
const tracker = new Html5Tracker(videoInstance, options);

// For setting userId
tracker.setUserId('userId');

// For Sending custom Attributes
tracker.sendOptions({
  customData: {
    contentTitle: 'Override Existing Title',
    customPlayerName: 'myGreatPlayer',
    customPlayerVersion: '9.4.2',
  },
});

// For sending Custom Video Action
tracker.sendCustom('CUSTOM_ACTION', 'state time', {
  test1: 'value1',
  test2: 'value2',
});

// For setting different harvest interval (1s to 5 mins)
tracker.setHarvestInterval(40000); // setting for 40 secs
```

## Data Model

To understand which actions and attributes are captured and emitted by the Html5 Player under different event types, see [DataModel.md](./DATAMODEL.md).

## Support

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic [Explorer's Hub](https://discuss.newrelic.com).

We encourage you to bring your experiences and questions to the [Explorer's Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

## Contributing

We encourage your contributions to improve New Relic Html5 Tracker! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project. If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company, please drop us an email at opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [our bug bounty program](https://docs.newrelic.com/docs/security/security-privacy/information-security/report-security-vulnerabilities/).

## License

New Relic Html5 Tracker is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
