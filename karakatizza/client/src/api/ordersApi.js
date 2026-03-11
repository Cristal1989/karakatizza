export async function createOrder(orderData) {
  console.log("A. createOrder викликався");
  console.log("B. orderData:", orderData);

  const response = await fetch("http://localhost:5000/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  console.log("C. response status:", response.status);

  const data = await response.json();
  console.log("D. response data:", data);

  if (!response.ok) {
    throw new Error(data.message || "Помилка відправки замовлення");
  }

  return data;
}
