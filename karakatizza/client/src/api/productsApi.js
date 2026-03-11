export async function getProducts() {
  const response = await fetch(
    "https://karakatizza-production.up.railway.app/products"
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Не вдалося отримати товари");
  }

  return data;
}

export async function deleteProduct(id) {
  const response = await fetch(
    `https://karakatizza-production.up.railway.app/products${id}`,
    {
      method: "DELETE",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Не вдалося видалити товар");
  }

  return data;
}

export async function updateProduct(id, formData) {
  const response = await fetch(
    `https://karakatizza-production.up.railway.app/products${id}`,
    {
      method: "PUT",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Не вдалося оновити товар");
  }

  return data;
}
