var myPlayer = document.getElementById('myPlayer');

// Intercept fetch to monitor API calls
(function () {
  var originalFetch = window.fetch;
  window.fetch = function () {
    var url = arguments[0];
    var options = arguments[1];

    console.log('🚀 [API Call] Fetch initiated');
    console.log('   URL:', url);
    console.log(
      '   Method:',
      options && options.method ? options.method : 'GET'
    );
    if (options && options.body) {
      try {
        var body = JSON.parse(options.body);
        console.log('   Payload events count:', body.ins ? body.ins.length : 0);
        console.log('   Payload:', body);
      } catch (e) {
        console.log('   Body:', options.body);
      }
    }

    return originalFetch
      .apply(this, arguments)
      .then(function (response) {
        console.log(
          '✅ [API Response] Status:',
          response.status,
          response.statusText
        );
        return response;
      })
      .catch(function (error) {
        console.error('❌ [API Error]', error.message);
        throw error;
      });
  };
})();

const options = {
  info: {
    beacon: '',
    licenseKey: '',
    applicationID: '',
  },
};

console.log('🎬 Initializing tracker with config:', options.info);

const tracker = new Html5Tracker(myPlayer, options);

console.log('✓ Tracker initialized');
console.log('✓ NRVIDEO config:', window.NRVIDEO);

// Log when video plays
myPlayer.addEventListener('play', function () {
  console.log('▶️ Video playing - events will be sent in ~10 seconds');
});
