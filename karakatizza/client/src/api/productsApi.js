const API_BASE_URL = "https://karakatizza-production.up.railway.app";

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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Не вдалося видалити товар");
  }

  return data;
}

export async function updateProduct(id, formData) {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "PUT",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Не вдалося оновити товар");
  }

  return data;
}

export function getImageUrl(imagePath) {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath}`;
}
