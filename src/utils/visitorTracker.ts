import { PERSONAL_PROFILE } from '../data/projects';

const SESSION_PING_KEY = 'ig_visitor_pinged';

/**
 * Parses user agent into a clean human-readable device string.
 */
function parseDeviceDetails(): string {
  const ua = navigator.userAgent || '';
  let os = 'Unknown Device';
  if (/iPhone/i.test(ua)) os = 'Apple iPhone';
  else if (/iPad/i.test(ua)) os = 'Apple iPad';
  else if (/Android/i.test(ua)) os = 'Android Device';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'Apple Mac';
  else if (/Windows NT/i.test(ua)) os = 'Windows PC';
  else if (/Linux/i.test(ua)) os = 'Linux';

  const isInstagramInApp = /Instagram/i.test(ua);
  const browser = isInstagramInApp
    ? 'Instagram In-App Browser'
    : /Chrome/i.test(ua)
    ? 'Chrome'
    : /Safari/i.test(ua)
    ? 'Safari'
    : /Firefox/i.test(ua)
    ? 'Firefox'
    : 'Web Browser';

  return `${os} · ${browser}`;
}

/**
 * Asynchronously sends an alert email to contact@aakashrobotics.tech
 * whenever someone opens the portfolio from Instagram.
 */
export async function trackInstagramVisitor(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Session deduplication: Only 1 notification per visitor session
    if (sessionStorage.getItem(SESSION_PING_KEY)) {
      return;
    }

    const ua = navigator.userAgent || '';
    const referrer = document.referrer || '';
    const search = window.location.search.toLowerCase();

    // 2. Multi-point detection for Instagram visitors:
    // - In-App Browser: Instagram sets 'Instagram' inside navigator.userAgent
    // - HTTP Referrer: l.instagram.com, lm.instagram.com, instagram.com
    // - Query Tags: utm_source=instagram, ref=instagram, ref=ig, source=ig
    const isFromInstagram =
      referrer.includes('instagram.com') ||
      ua.includes('Instagram') ||
      search.includes('instagram') ||
      search.includes('ref=ig') ||
      search.includes('source=ig');

    if (!isFromInstagram) {
      return;
    }

    // Set session lock immediately to prevent duplicate alerts
    sessionStorage.setItem(SESSION_PING_KEY, '1');

    // 3. Approximate Geolocation lookup (fast 1.2s timeout fallback)
    let locationStr = 'Location lookup timed out';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res && res.ok) {
        const geo = await res.json().catch(() => null);
        if (geo) {
          const city = geo.city || '';
          const region = geo.region || '';
          const country = geo.country_name || '';
          const isp = geo.org || '';
          locationStr = [city, region, country, isp ? `(${isp})` : '']
            .filter(Boolean)
            .join(', ');
        }
      }
    } catch {
      // ignore network errors
    }

    const istTime = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(new Date());

    const device = parseDeviceDetails();
    const targetEmail = PERSONAL_PROFILE.contact.email; // contact@aakashrobotics.tech

    // 4. Send background notification to FormSubmit
    await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: '🚀 New Instagram Visitor on aakashrobotics.tech',
        Visitor_Source: 'Instagram',
        Referrer_Header: referrer || 'Instagram In-App WebView',
        Device_and_OS: device,
        Screen_Resolution: `${window.innerWidth} x ${window.innerHeight} px`,
        Approx_Location: locationStr,
        Landing_URL: window.location.href,
        Timestamp_IST: istTime,
        Device_Language: navigator.language || 'en',
        _template: 'table',
        _captcha: 'false',
      }),
    });
  } catch (err) {
    // Fail silently so page performance is 100% unaffected
    console.debug('Tracker silent notice:', err);
  }
}
