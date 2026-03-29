const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getSiteSettings() {
  const response = await fetch(`${API_BASE}/api/settings`);

  if (!response.ok) {
    throw new Error("Не вдалося завантажити налаштування сайту");
  }

  return response.json();
}

export async function updateWorkingHours(payload) {
  const response = await fetch(`${API_BASE}/api/settings/working-hours`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося зберегти робочі години");
  }

  return data;
}