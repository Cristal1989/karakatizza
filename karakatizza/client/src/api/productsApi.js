export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://karakatizza-production.up.railway.app";

const PRODUCTS_CACHE_KEY = "products_cache_v1";
const PRODUCTS_CACHE_TTL = 1000 * 60 * 5;

export async function getProducts() {
  const cachedRaw = localStorage.getItem(PRODUCTS_CACHE_KEY);

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);

      if (Date.now() - cached.timestamp < PRODUCTS_CACHE_TTL) {
        return cached.data;
      }
    } catch {
      localStorage.removeItem(PRODUCTS_CACHE_KEY);
    }
  }

  const res = await fetch(`${API_BASE_URL}/products`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося отримати товари");
  }

  localStorage.setItem(
    PRODUCTS_CACHE_KEY,
    JSON.stringify({
      timestamp: Date.now(),
      data,
    })
  );

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

  localStorage.removeItem("products_cache_v1");

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

  localStorage.removeItem("products_cache_v1");

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

  localStorage.removeItem("products_cache_v1");

  return data;
}

export function getImageUrl(image, options = {}) {
  if (!image) return "";

  const { width = 600, height = 600, crop = "fill" } = options;

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
