const VISITOR_ID_KEY = "kara_visitor_id";
const SESSION_ID_KEY = "kara_session_id";
const TRAFFIC_SOURCE_KEY = "kara_traffic_source";
const API_BASE = import.meta.env.VITE_API_URL || "https://karakatizza-production.up.railway.app";

function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId() {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);

    if (!visitorId) {
      visitorId = generateId("visitor");
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    return visitorId;
  } catch (error) {
    console.error("GET VISITOR ID ERROR:", error);
    return generateId("visitor_fallback");
  }
}

export function getSessionId() {
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
      sessionId = generateId("session");
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    return sessionId;
  } catch (error) {
    console.error("GET SESSION ID ERROR:", error);
    return generateId("session_fallback");
  }
}

function getStoredTrafficSource() {
  try {
    const raw = sessionStorage.getItem(TRAFFIC_SOURCE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error("GET STORED TRAFFIC SOURCE ERROR:", error);
    return null;
  }
}

function saveTrafficSource(data) {
  try {
    sessionStorage.setItem(TRAFFIC_SOURCE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("SAVE TRAFFIC SOURCE ERROR:", error);
  }
}

function getTrafficSource() {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    const currentTrafficSource = {
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || "",
      utmTerm: params.get("utm_term") || "",
      gclid: params.get("gclid") || "",
      fbclid: params.get("fbclid") || "",
      referrer: document.referrer || "",
    };

    const storedTrafficSource = getStoredTrafficSource();

    const hasNewAttribution =
      currentTrafficSource.gclid ||
      currentTrafficSource.fbclid ||
      currentTrafficSource.utmSource ||
      currentTrafficSource.utmMedium ||
      currentTrafficSource.utmCampaign;

    const traffic =
      hasNewAttribution
        ? currentTrafficSource
        : storedTrafficSource || currentTrafficSource;

    const utmSourceLower = String(traffic.utmSource || "").toLowerCase();
    const utmMediumLower = String(traffic.utmMedium || "").toLowerCase();
    const ref = String(traffic.referrer || "").toLowerCase();

    let source = "direct";

    if (traffic.gclid || utmSourceLower === "google" || utmMediumLower === "cpc") {
      source = "google_ads";
    } else if (
      utmSourceLower === "instagram" ||
      utmSourceLower === "ig" ||
      ref.includes("instagram.com") ||
      ref.includes("l.instagram.com")
    ) {
      source = "instagram";
    } else if (
      utmSourceLower === "facebook" ||
      utmSourceLower === "fb" ||
      traffic.fbclid ||
      ref.includes("facebook.com") ||
      ref.includes("m.facebook.com") ||
      ref.includes("l.facebook.com")
    ) {
      source = "facebook";
    } else if (utmSourceLower) {
      source = utmSourceLower;
    }

    const result = {
      source,
      utmSource: traffic.utmSource || "",
      utmMedium: traffic.utmMedium || "",
      utmCampaign: traffic.utmCampaign || "",
      utmContent: traffic.utmContent || "",
      utmTerm: traffic.utmTerm || "",
      gclid: traffic.gclid || "",
      fbclid: traffic.fbclid || "",
      referrer: traffic.referrer || "",
    };

    if (hasNewAttribution) {
      saveTrafficSource(result);
    }

    return result;
  } catch (error) {
    console.error("GET TRAFFIC SOURCE ERROR:", error);

    return {
      source: "unknown",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmContent: "",
      utmTerm: "",
      gclid: "",
      fbclid: "",
      referrer: document.referrer || "",
    };
  }
}

export async function trackEvent(eventName, metadata = {}, extra = {}) {
  try {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();

    const trafficSource = getTrafficSource();

    const payload = {
      visitorId,
      sessionId,
      eventName,
      path: window.location.pathname || "",
      pageUrl: window.location.href || "",
      referrer: document.referrer || "",
      metadata: {
        ...trafficSource,
        ...metadata,
      },
      ...extra,
    };

    await fetch(`${API_BASE}/api/crm/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("TRACK EVENT FRONT ERROR:", error);
  }
}

export async function markCurrentDeviceInternal(label = "") {
  try {
    const visitorId = getVisitorId();

    const response = await fetch(`${API_BASE}/api/crm/track/mark-internal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        visitorId,
        label,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Не вдалося позначити пристрій");
    }

    return data;
  } catch (error) {
    console.error("MARK INTERNAL DEVICE ERROR:", error);
    throw error;
  }
}