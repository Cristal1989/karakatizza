import { API_BASE_URL } from "./config";

export async function createOrder(orderData) {
  const response = await fetch(`${API_BASE_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Помилка відправки замовлення");
  }

  return data;
}
