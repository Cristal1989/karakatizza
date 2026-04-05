import { API_BASE_URL } from "./productsApi";

export async function createOrder(orderData) {
  console.log("CREATE ORDER PAYLOAD", orderData);
  const response = await fetch(`${API_BASE_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 200)}`);
  }

  console.log("CREATE ORDER RESPONSE", data);

  if (!response.ok) {
    throw new Error(data.message || "Помилка відправки замовлення");
  }

  return data;
}
