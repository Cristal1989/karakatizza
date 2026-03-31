const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getSiteSettings() {
  const response = await fetch(`${API_BASE}/api/settings`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося завантажити налаштування");
  }

  return data;
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

export async function updatePopupSettings(payload) {
  const response = await fetch(`${API_BASE}/api/settings/popup`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося зберегти налаштування попапа");
  }

  return data;
}

export async function updateContactsSettings(payload) {
  const response = await fetch(`${API_BASE}/api/settings/contacts`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося зберегти контакти");
  }

  return data;
}

export async function updateDeliverySettings(payload) {
  const response = await fetch(`${API_BASE}/api/settings/delivery`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося зберегти налаштування доставки");
  }

  return data;
}

export async function updatePaymentSettings(payload) {
  const response = await fetch(`${API_BASE}/api/settings/payment`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося зберегти налаштування оплати");
  }

  return data;
}

export async function updateSiteTexts(payload) {
  const response = await fetch(`${API_BASE}/api/settings/texts`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося зберегти тексти сайту");
  }

  return data;
}