const API_BASE_URL = import.meta.env.VITE_API_URL || "https://karakatizza-production.up.railway.app";

export async function getPromotionSettings() {
  const res = await fetch(`${API_BASE_URL}/promotions/settings`);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося отримати налаштування акції");
  }

  return data;
}

export async function updatePromotionSettings(payload) {
  const res = await fetch(`${API_BASE_URL}/promotions/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося оновити налаштування акції");
  }

  return data;
}
