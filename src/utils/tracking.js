function getCookie(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Fire a Meta 'Lead' event via both browser pixel and server-side CAPI.
 * The shared event_id lets Meta deduplicate so it counts as one conversion.
 */
export async function trackLead(section = 'unknown') {
  const eventId = generateEventId()

  // Browser pixel — fires immediately so attribution is captured even if CAPI call is slow
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', { content_name: `cta_${section}` }, { eventID: eventId })
  }

  // Server-side CAPI — runs server-to-Meta so ad blockers can't stop it
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'Lead',
        event_id: eventId,
        event_source_url: typeof window !== 'undefined' ? window.location.href : '',
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
      }),
    })
  } catch (_) {
    // fail silently — browser pixel already fired
  }

  if (import.meta.env.DEV) {
    console.log('[i88 CAPI] Lead sent', { eventId, section })
  }
}

/**
 * General custom event — GTM dataLayer + Meta custom event.
 */
export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ event: eventName, ...params })
    }
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, params)
    }
  } catch (_) {}

  if (import.meta.env.DEV) {
    console.log('[i88 Track]', eventName, params)
  }
}
