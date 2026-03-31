export function normalizeUaPhone(phone) {
  const raw = String(phone || "").trim();

  const digits = raw.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("380")) {
    return digits;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    return `38${digits}`;
  }

  return "";
}

export function isValidUaPhone(phone) {
  const normalized = normalizeUaPhone(phone);
  return /^380\d{9}$/.test(normalized);
}