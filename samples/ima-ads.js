/**
 * IMA sample is setup using - https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/get-started
 */

let adsManager;
let adsLoader;
let adDisplayContainer;
let isAdPlaying;
let isContentFinished;
let videoContent;
let adContainer;

class adTracking {
  // NOTE: Make sure you are setting up before onAdsReady is called
  static setupPlayerForAdTracking() {
    // enriches player with ima object for new relic tracking
    videoContent.ima = {
      getAdsManager: () => adsManager,
      addEventListener: adsManager.addEventListener.bind(adsManager),
    }
  }

  static onAdsready() {
    // send custom event on player for new relic tracking
    const customEvent = new CustomEvent('adsready', {
      detail: {}
    });
    videoContent.dispatchEvent(customEvent);
  }

  static onAdStart() {
    // send custom event on player for new relic tracking
    const customEvent = new CustomEvent('adstart', {
      detail: {}
    });
    videoContent.dispatchEvent(customEvent);
  }

  static onAdEnd() {
    // send custom event on player for new relic tracking
    const customEvent = new CustomEvent('adend', {
      detail: {}
    });
    videoContent.dispatchEvent(customEvent);
  }
}

/**
 * Handles clicks on the ad container to support expected play and pause
 * behavior on mobile devices.
 * @param {!Event} event
 */
function adContainerClick(event) {
  if (videoContent.paused) {
    videoContent.play();
  } else {
    videoContent.pause();
  }
}


/**
 * Loads the video content and initializes IMA ad playback.
 */
function playAds() {
  // Initialize the container. Must be done through a user action on mobile
  // devices.
  // videoContent.load(); // use this if using custom play button
  adDisplayContainer.initialize();

  try {
    // Initialize the ads manager. This call starts ad playback for VMAP ads.
    adsManager.init(640, 360);
    // Call play to start showing the ad. Single video and overlay ads will
    // start at this time; the call will be ignored for VMAP ads.
    adsManager.start();
  } catch (adError) {
    // An error may be thrown if there was a problem with the VAST response.
    videoContent.play();
  }
}


/**
 * Handles ad errors.
 * @param {!google.ima.AdErrorEvent} adErrorEvent
 */
function onAdError(adErrorEvent) {
  // Handle the error logging.
  console.log(adErrorEvent.getError());
  adsManager.destroy();
}

/**
 * Pauses video content and sets up ad UI.
 */
function onContentPauseRequested() {
  isAdPlaying = true;
  videoContent.pause();
  // This function is where you should setup UI for showing ads (for example,
  // display ad timer countdown, disable seeking and more.)
  // setupUIForAds();

  adTracking.onAdStart();
}

/**
 * Resumes video content and removes ad UI.
 */
function onContentResumeRequested() {
  isAdPlaying = false;
  if (!isContentFinished) {
    videoContent.play();
  }
  // This function is where you should ensure that your UI is ready
  // to play content. It is the responsibility of the Publisher to
  // implement this function when necessary.
  // setupUIForContent();

  adTracking.onAdEnd();
}

/**
 * Handles ad loaded event to support non-linear ads. Continues content playback
 * if the ad is not linear.
 * @param {!google.ima.AdEvent} adEvent
 */
function onAdLoaded(adEvent) {
  let ad = adEvent.getAd();
  if (!ad.isLinear()) {
    videoContent.play();
  }
}

/**
 * Handles the ad manager loading and sets ad event listeners.
 * @param {!google.ima.AdsManagerLoadedEvent} adsManagerLoadedEvent
 */
function onAdsManagerLoaded(adsManagerLoadedEvent) {
  // Get the ads manager.
  const adsRenderingSettings = new google.ima.AdsRenderingSettings();
  adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
  adsManager =
    adsManagerLoadedEvent.getAdsManager(videoContent, adsRenderingSettings);

  adTracking.setupPlayerForAdTracking();
  adTracking.onAdsready();

  // Add listeners to the required events.
  adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
    onContentResumeRequested);
  adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdLoaded);
}

/**
 * Sets up IMA ad display container, ads loader, and makes an ad request.
 */
function setUpIMA() {
  // Create the ad display container.
  createAdDisplayContainer();
  // Create ads loader.
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);
  // Listen and respond to ads loaded and error events.
  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded, false);
  adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);

  // An event listener to tell the SDK that our content video
  // is completed so the SDK can play any post-roll ads.
  const contentEndedListener = function() {
    // An ad might have been playing in the content element, in which case the
    // content has not actually ended.
    if (isAdPlaying) return;
    isContentFinished = true;
    adsLoader.contentComplete();
  };
  videoContent.onended = contentEndedListener;

  // Request video ads.
  const adsRequest = new google.ima.AdsRequest();


  // pre mid post roll
  adsRequest.adTagUrl =
    'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/vmap_ad_samples&sz=640x480&cust_params=sample_ar%3Dpremidpost&ciu_szs=300x250&gdfp_req=1&ad_rule=1&output=vmap&unviewed_position_start=1&env=vp&impl=s&cmsid=496&vid=short_onecue&correlator=',

  // Specify the linear and nonlinear slot sizes. This helps the SDK to
  // select the correct creative if multiple are returned.
  adsRequest.linearAdSlotWidth = 640;
  adsRequest.linearAdSlotHeight = 400;

  adsRequest.nonLinearAdSlotWidth = 640;
  adsRequest.nonLinearAdSlotHeight = 150;

  adsLoader.requestAds(adsRequest);
}

// On window load, attach an event to the play button click
// that triggers playback of the video element.
window.addEventListener('load', function(event) {
  videoContent = document.getElementById('myPlayer');
  adContainer = document.getElementById('adContainer');
  adContainer.addEventListener('click', adContainerClick);
  videoContent.addEventListener('play', playAds);
  setUpIMA();
});

function createAdDisplayContainer() {
  adDisplayContainer = new google.ima.AdDisplayContainer(
    document.getElementById('adContainer'), videoContent);
}

