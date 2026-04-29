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

async function adminGet(path, params = {}) {
  const query = buildQuery(params);
  const url = `${API_BASE}${path}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: getAdminHeaders(),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Помилка запиту");
  }

  return data;
}

export async function getAnalyticsFunnel(filters = {}) {
  const data = await adminGet("/api/crm/analytics/funnel", filters);
  return data.funnel;
}

export async function getAnalyticsEvents(filters = {}) {
  const data = await adminGet("/api/crm/analytics/events", filters);
  return data;
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

export async function clearAnalytics() {
  const response = await fetch(`${API_BASE}/api/crm/analytics/clear`, {
    method: "POST",
    headers: getAdminHeaders(),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Не вдалося очистити аналітику");
  }

  return data;
}