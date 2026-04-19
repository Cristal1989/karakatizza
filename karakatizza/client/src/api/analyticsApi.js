import { getAdminHeaders } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "https://karakatizza-production.up.railway.app";

export async function getAnalyticsSummary(range = "today") {
  const response = await fetch(
    `${API_BASE}/api/crm/analytics/summary?range=${encodeURIComponent(range)}`
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Не вдалося отримати summary");
  }

  return data.summary;
}

export async function getAnalyticsEvents(
  limit = 50,
  includeInternal = false,
  range = "today"
) {
  const response = await fetch(
    `${API_BASE}/api/crm/analytics/events?limit=${limit}&includeInternal=${includeInternal}&range=${encodeURIComponent(range)}`
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Не вдалося отримати events");
  }

  return data.events;
}

export async function clearAnalytics() {
  const response = await fetch(`${API_BASE}/api/crm/analytics/clear`, {
    method: "POST",
    headers: getAdminHeaders({
      "Content-Type": "application/json",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Не вдалося очистити аналітику");
  }

  return data;
}