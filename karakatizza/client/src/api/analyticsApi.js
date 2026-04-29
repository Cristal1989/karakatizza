import { getAdminHeaders } from "./auth";

const API_BASE =
  import.meta.env.VITE_API_URL || "https://karakatizza-production.up.railway.app";

function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === "") return;
    search.set(key, String(value));
  });

  return search.toString();
}

function buildRangeFilters(range = "today") {
  if (range === "today") {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return {
      date_from: start.toISOString(),
      date_to: now.toISOString(),
    };
  }

  return {};
}

async function parseJsonSafe(response, url) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("ANALYTICS NON-JSON RESPONSE:", {
      url,
      status: response.status,
      text: text.slice(0, 500),
    });

    throw new Error(`API повернув не JSON (${response.status})`);
  }
}

async function adminGet(path, params = {}) {
  const query = buildQuery(params);
  const url = `${API_BASE}${path}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: getAdminHeaders(),
  });

  const data = await parseJsonSafe(response, url);

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Помилка запиту");
  }

  return data;
}

/**
 * НОВИЙ API
 */
export async function getAnalyticsFunnel(filters = {}) {
  const data = await adminGet("/api/crm/analytics/funnel", filters);
  return data.funnel;
}

export async function getAnalyticsReportSources(filters = {}) {
  const data = await adminGet("/api/crm/analytics/reports/sources", filters);
  return data.rows || [];
}

export async function getAnalyticsReportCampaigns(filters = {}) {
  const data = await adminGet("/api/crm/analytics/reports/campaigns", filters);
  return data.rows || [];
}

export async function getAnalyticsReportLandingPages(filters = {}) {
  const data = await adminGet("/api/crm/analytics/reports/landing-pages", filters);
  return data.rows || [];
}

/**
 * BACKWARD COMPAT: старий Admin.jsx
 * getAnalyticsSummary("today" | "all")
 */
export async function getAnalyticsSummary(range = "today") {
  const filters = buildRangeFilters(range);
  const funnel = await getAnalyticsFunnel(filters);

  return {
    uniqueVisitors: Number(funnel?.visits || 0),
    addToCartVisitors: Number(funnel?.add_to_cart || 0),
    checkoutVisitors: Number(funnel?.checkout_view || 0),
    ordersCount: Number(funnel?.order_created || 0),
    conversionRate: Number(funnel?.cr || 0),
  };
}

/**
 * Підтримує 2 формати:
 * 1) новий: getAnalyticsEvents({ ...filters })
 * 2) старий: getAnalyticsEvents(limit, includeInternal, range)
 */
export async function getAnalyticsEvents(arg1 = {}, arg2 = false, arg3 = "today") {
  let filters = {};

  if (typeof arg1 === "object" && arg1 !== null && !Array.isArray(arg1)) {
    filters = { ...arg1 };
  } else {
    const limit = Number(arg1 || 50);
    const includeInternal = Boolean(arg2);
    const range = String(arg3 || "today");

    filters = {
      limit,
      includeInternal,
      ...buildRangeFilters(range),
    };
  }

  const data = await adminGet("/api/crm/analytics/events", filters);

  if (data.group_by === "none") {
    return data.events || [];
  }

  return data;
}

export async function clearAnalytics() {
  const response = await fetch(`${API_BASE}/api/crm/analytics/clear`, {
    method: "POST",
    headers: getAdminHeaders(),
  });

  const data = await parseJsonSafe(
    response,
    `${API_BASE}/api/crm/analytics/clear`
  );

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Не вдалося очистити аналітику");
  }

  return data;
}