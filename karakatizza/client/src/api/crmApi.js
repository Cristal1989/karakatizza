import { API_BASE_URL } from "./productsApi";

export async function getCustomers(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.orderType && params.orderType !== "all") {
    searchParams.set("orderType", params.orderType);
  }

  if (params.telegram && params.telegram !== "all") {
    searchParams.set("telegram", params.telegram);
  }

  if (params.inactiveDays) {
    searchParams.set("inactiveDays", params.inactiveDays);
  }

  if (params.minTotalSpent) {
    searchParams.set("minTotalSpent", params.minTotalSpent);
  }
  
  if (params.minLastOrderAmount) {
    searchParams.set("minLastOrderAmount", params.minLastOrderAmount);
  }

  const query = searchParams.toString();
  const url = `${API_BASE_URL}/api/crm/customers${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося завантажити клієнтів");
  }

  return data;
}

export async function getCustomerOrders(customerId) {
  const response = await fetch(
    `${API_BASE_URL}/api/crm/customers/${customerId}/orders`,
    {
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Не вдалося завантажити замовлення клієнта");
  }

  return data;
}