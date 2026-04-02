import { API_BASE_URL } from "./productsApi";
import { getAdminHeaders } from "./auth";

const BANNERS_CACHE_KEY = "banners_cache_v1";
const BANNERS_CACHE_TTL = 1000 * 60 * 5;

export async function getBanners() {
  const cachedRaw = localStorage.getItem(BANNERS_CACHE_KEY);

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);

      if (Date.now() - cached.timestamp < BANNERS_CACHE_TTL) {
        return cached.data;
      }
    } catch {
      localStorage.removeItem(BANNERS_CACHE_KEY);
    }
  }

  const res = await fetch(`${API_BASE_URL}/banners`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося отримати банери");
  }

  localStorage.setItem(
    BANNERS_CACHE_KEY,
    JSON.stringify({
      timestamp: Date.now(),
      data,
    })
  );

  return data;
}

export async function createBanner(formData) {
  const res = await fetch(`${API_BASE_URL}/banners`, {
    method: "POST",
    headers: getAdminHeaders(),
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося створити банер");
  }

  localStorage.removeItem("banners_cache_v1");

  return data;
}

export async function updateBanner(id, formData) {
  const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
    method: "PUT",
    headers: getAdminHeaders(),
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося оновити банер");
  }

  localStorage.removeItem("banners_cache_v1");

  return data;
}

export async function deleteBanner(id) {
  const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося видалити банер");
  }

  localStorage.removeItem("banners_cache_v1");

  return data;
}

export async function trackBannerClick(id) {
  const res = await fetch(`${API_BASE_URL}/banners/${id}/click`, {
    method: "POST",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося зарахувати клік");
  }

  return data;
}

export async function reorderBanners(items) {
  const res = await fetch(`${API_BASE_URL}/banners/reorder`, {
    method: "PUT",
    headers: getAdminHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ items }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося змінити порядок банерів");
  }

  return data;
}
