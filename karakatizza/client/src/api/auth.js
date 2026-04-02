export function getAdminToken() {
  return localStorage.getItem("adminToken") || "";
}

export function getAdminHeaders(extraHeaders = {}) {
  const token = getAdminToken();

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  };
}