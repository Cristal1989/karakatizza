export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://karakatizza-production.up.railway.app";

export function getImageUrl(image, options = {}) {
  if (!image) return "";

  const { width = 600, height = 600, crop = "fill" } = options;

  if (image.startsWith("http")) {
    if (image.includes("/image/upload/")) {
      return image.replace(
        `"/image/upload/",
        /image/upload/f_auto,q_auto,w_${width},h_${height},c_${crop}/`
      );
    }

    return image;
  }

  return `${API_BASE_URL}${image}`;
}

export async function getProducts() {
  const res = await fetch(`${API_BASE_URL}/products?ts=${Date.now()}`, {
    cache: "no-store",
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
