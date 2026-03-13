import { API_BASE_URL } from "./productsApi";

export async function getBanners() {
  const res = await fetch(`${API_BASE_URL}/banners`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося отримати банери");
  }

  return data;
}

export async function createBanner(formData) {
  const res = await fetch(`${API_BASE_URL}/banners`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося створити банер");
  }

  return data;
}

export async function updateBanner(id, formData) {
  const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
    method: "PUT",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося оновити банер");
  }

  return data;
}

export async function deleteBanner(id) {
  const res = await fetch(`${API_BASE_URL}/banners/${id}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося видалити банер");
  }

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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Не вдалося змінити порядок банерів");
  }

  return data;
}
