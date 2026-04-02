import { API_BASE_URL } from "./productsApi";

export async function getCustomers(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.orderType && params.orderType !== "all") {
    searchParams.set("orderType", params.orderType);
  }

  if (params.telegram && params.telegram !== "all") {
    searchParams.set("telegram", params.telegram);
  }

  if (params.inactiveDays) {
    searchParams.set("inactiveDays", params.inactiveDays);
  }

  if (params.minTotalSpent) {
    searchParams.set("minTotalSpent", params.minTotalSpent);
  }
  
  if (params.minLastOrderAmount) {
    searchParams.set("minLastOrderAmount", params.minLastOrderAmount);
  }

  const query = searchParams.toString();
  const url = `${API_BASE_URL}/api/crm/customers${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося завантажити клієнтів");
  }

  return data;
}

export async function getCustomerOrders(customerId) {
  const response = await fetch(
    `${API_BASE_URL}/api/crm/customers/${customerId}/orders`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося завантажити замовлення клієнта");
  }

  return data;
}

export async function sendTelegramMessageToOne({
  telegramUserId,
  text,
}) {
  const response = await fetch(`${API_BASE_URL}/api/crm/telegram/send-one`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      telegramUserId,
      text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося відправити повідомлення");
  }

  return data;
}

export async function sendTelegramBroadcast({
  text,
  search = "",
  orderType = "all",
  inactiveDays = "",
  minTotalSpent = "",
  minLastOrderAmount = "",
}) {
  const response = await fetch(`${API_BASE_URL}/api/crm/telegram/send-broadcast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      search,
      orderType,
      inactiveDays,
      minTotalSpent,
      minLastOrderAmount,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося виконати розсилку");
  }

  return data;
}

export async function getTelegramBroadcastCount({
  search = "",
  orderType = "all",
  inactiveDays = "",
  minTotalSpent = "",
  minLastOrderAmount = "",
}) {
  const response = await fetch(`${API_BASE_URL}/api/crm/telegram/broadcast-count`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      search,
      orderType,
      inactiveDays,
      minTotalSpent,
      minLastOrderAmount,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося порахувати отримувачів");
  }

  return data;
}

export async function getTelegramBroadcastHistory(limit = 20) {
  const response = await fetch(
    `${API_BASE_URL}/api/crm/telegram/broadcast-history?limit=${limit}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося отримати історію розсилок");
  }

  return data;
}

export async function issueTestTelegramBonus(payload) {
  const res = await fetch(`${API_BASE_URL}/api/crm/telegram-gifts/issue-test`, {
    method: "POST",
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
    throw new Error(data.message || "Не вдалося видати тестовий бонус");
  }

  return data;
}

export async function useActiveTelegramBonus(payload) {
  const res = await fetch(`${API_BASE_URL}/api/crm/telegram-gifts/use-active`, {
    method: "POST",
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
    throw new Error(data.message || "Не вдалося списати активний бонус");
  }

  return data;
}


export async function getTelegramCheckoutStatus(phone) {
  const encodedPhone = encodeURIComponent(phone || "");

  const res = await fetch(
    `${API_BASE_URL}/api/crm/telegram-checkout-status/${encodedPhone}`
  );

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер вернул не JSON: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(
      data?.message || "Не вдалося отримати Telegram-статус для checkout"
    );
  }

  return data;
}

export async function getCustomerBonusHistory(customerId) {
  const res = await fetch(`${API_BASE_URL}/api/crm/customers/${customerId}/bonus-history`);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося завантажити історію бонусів");
  }

  return data;
}