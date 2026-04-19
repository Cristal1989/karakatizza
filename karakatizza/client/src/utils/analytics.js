const VISITOR_ID_KEY = "kara_visitor_id";
const SESSION_ID_KEY = "kara_session_id";
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

function getTrafficSource() {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    const utmSource = params.get("utm_source") || "";
    const utmMedium = params.get("utm_medium") || "";
    const utmCampaign = params.get("utm_campaign") || "";
    const utmContent = params.get("utm_content") || "";
    const utmTerm = params.get("utm_term") || "";
    const gclid = params.get("gclid") || "";
    const fbclid = params.get("fbclid") || "";
    const referrer = document.referrer || "";

    let source = "direct";

    const ref = referrer.toLowerCase();
    const utmSourceLower = utmSource.toLowerCase();
    const utmMediumLower = utmMedium.toLowerCase();

    if (gclid || utmSourceLower === "google" || utmMediumLower === "cpc") {
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
      fbclid ||
      ref.includes("facebook.com") ||
      ref.includes("m.facebook.com") ||
      ref.includes("l.facebook.com")
    ) {
      source = "facebook";
    } else if (utmSourceLower) {
      source = utmSourceLower;
    } else if (ref) {
      source = ref;
    }

    return {
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      gclid,
      fbclid,
      referrer,
    };
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