import { getAdminHeaders } from "./auth";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://karakatizza-production.up.railway.app";

export function getImageUrl(image, options = {}) {
  if (!image) return "";

  const { width = 600, height = 600, crop = "fit" } = options;

  if (image.startsWith("http")) {
    if (image.includes("/image/upload/")) {
      return image.replace(
        "/image/upload/",
        `/image/upload/f_auto,q_auto,w_${width},h_${height},c_${crop}/`
      );
    }

    return image;
  }

  return `${API_BASE_URL}${image}`;
}

export async function getProducts(isAdmin = false) {
  const query = isAdmin ? "?admin=1" : "";
  const url = `${API_BASE_URL}/products${query}${query ? "&" : "?"}ts=${Date.now()}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: isAdmin ? getAdminHeaders() : {},
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося отримати товари");
  }

  return data;
}

export async function createProduct(formData) {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: getAdminHeaders(),
    body: formData,
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося створити товар");
  }

  return data;
}

export async function updateProduct(id, formData) {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "PUT",
    headers: getAdminHeaders(),
    body: formData,
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося оновити товар");
  }

  return data;
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(),
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Сервер повернув не JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося видалити товар");
  }

  return data;
}
