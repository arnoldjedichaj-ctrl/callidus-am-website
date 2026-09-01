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
  const trackedUrl = new URL(window.location.href);
  const allowedParameters = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'gclid',
    'dclid',
    'gbraid',
    'wbraid',
  ]);

  // Nur sichere Kampagnenparameter behalten: So bleiben z. B. ChatGPT-Referrals
  // messbar, ohne versehentlich Formular- oder personenbezogene Parameter zu senden.
  for (const key of [...trackedUrl.searchParams.keys()]) {
    if (!allowedParameters.has(key)) trackedUrl.searchParams.delete(key);
  }
  trackedUrl.hash = '';
  const locationKey = trackedUrl.href;
  if (locationKey === lastTrackedLocation) return;

  const analytics = await getAnalyticsInstance();
  if (!analytics) return;
  lastTrackedLocation = locationKey;
  analytics.logEvent(analytics.analytics, 'page_view', {
    // Die konkrete Landingpage ist für SEO-, ChatGPT- und Conversion-Auswertung
    // erforderlich; gemessen wird weiterhin erst nach Einwilligung.
    page_location: locationKey,
    page_title: document.title,
  });
}

export function setupConsentAwareAnalytics() {
  void trackWebsiteVisit();
  window.addEventListener('callidus-consent', (event) => {
    if (event.detail === 'all') void trackWebsiteVisit();
  });
  document.addEventListener('astro:page-load', () => void trackWebsiteVisit());
}
