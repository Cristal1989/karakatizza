const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://karakatizza-production.up.railway.app";

export async function getGiftRollSettings() {
  const res = await fetch(`${API_BASE_URL}/gift-roll/settings`);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер вернул не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(
      data.message || "Не удалось получить настройки подарочного ролла"
    );
  }

  return data;
}

export async function updateGiftRollSettings(payload) {
  const res = await fetch(`${API_BASE_URL}/gift-roll/settings`, {
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
    throw new Error(`Сервер вернул не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(
      data.message || "Не удалось обновить настройки подарочного ролла"
    );
  }

  return data;
}
