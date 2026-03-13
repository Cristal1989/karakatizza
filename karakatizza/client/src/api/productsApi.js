export const API_BASE_URL = "https://karakatizza-production.up.railway.app";

export async function getProducts() {
  const res = await fetch(`${API_BASE_URL}/products`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося отримати товари");
  }

  return data;
}

export async function createProduct(formData) {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Помилка створення товару");
  }

  return data;
}

export async function updateProduct(id, formData) {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "PUT",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося оновити товар");
  }

  return data;
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося видалити товар");
  }

  return data;
}

export function getImageUrl(image) {
  if (!image) return "";

  if (image.startsWith("http")) {
    return image;
  }

  if (image.startsWith("/uploads/")) {
    return `${API_BASE_URL}${image}`;
  }

  if (image.startsWith("/images/")) {
    return image;
  }

  return image;
}
