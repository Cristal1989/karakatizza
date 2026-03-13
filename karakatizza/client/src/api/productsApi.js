export const API_BASE_URL = "https://karakatizza-production.up.railway.app";

export async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/products`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Не вдалося отримати товари");
  }

  return data;
}

export async function createProduct(formData) {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 300)}`);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Помилка створення товару");
  }

  return data;
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "DELETE",
  });

  const contentType = response.headers.get("content-type") || "";

  let data = {};

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(data.message || "Не вдалося видалити товар");
  }

  return data;
}

export function getImageUrl(imagePath) {
  if (!imagePath) return "";

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  if (imagePath.startsWith("/uploads/")) {
    return `${API_BASE_URL}${imagePath}`;
  }

  if (imagePath.startsWith("/images/")) {
    return imagePath;
  }

  return imagePath;
}
