let analyticsPromise;
let lastTrackedLocation = '';

function hasAnalyticsConsent() {
  return localStorage.getItem('callidus-cookie-consent-v2') === 'all';
}

async function getAnalyticsInstance() {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      const [{ app }, analyticsApi] = await Promise.all([
        import('../lib/firebase-client.js'),
        import('firebase/analytics'),
      ]);
      if (!(await analyticsApi.isSupported())) return null;
      return {
        analytics: analyticsApi.initializeAnalytics(app, {
          config: { send_page_view: false },
        }),
        logEvent: analyticsApi.logEvent,
      };
    })().catch(() => null);
  }
  return analyticsPromise;
}

async function trackWebsiteVisit() {
  if (!hasAnalyticsConsent()) return;
  const locationKey = window.location.href;
  if (locationKey === lastTrackedLocation) return;

  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  lastTrackedLocation = locationKey;
  analytics.logEvent(analytics.analytics, 'page_view', {
    // Keep website tracking aggregated: do not send article, health-topic, or
    // search-path details to Analytics.
    page_location: window.location.origin,
    page_title: 'callidus A&M Website',
  });
}

export function setupConsentAwareAnalytics() {
  void trackWebsiteVisit();
  window.addEventListener('callidus-consent', (event) => {
    if (event.detail === 'all') void trackWebsiteVisit();
  });
  document.addEventListener('astro:page-load', () => void trackWebsiteVisit());
}
