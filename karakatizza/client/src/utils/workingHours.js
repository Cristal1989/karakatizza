export function isOutsideWorkingHours(openTime, closeTime) {
  if (!openTime || !closeTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHours, openMinutes] = openTime.split(":").map(Number);
  const [closeHours, closeMinutes] = closeTime.split(":").map(Number);

  const openTotal = openHours * 60 + openMinutes;
  const closeTotal = closeHours * 60 + closeMinutes;

  return currentMinutes < openTotal || currentMinutes >= closeTotal;
}

export function getWorkingHoursLabel(workingHours) {
  if (!workingHours) return "";

  if (workingHours.closedToday) {
    return "Сьогодні зачинено";
  }

  return `${workingHours.openTime} – ${workingHours.closeTime}`;
}

export function getWorkingStatusLabel(workingHours) {
  if (!workingHours) return "";

  if (workingHours.closedToday) {
    return "Сьогодні зачинено";
  }

  const outside = isOutsideWorkingHours(
    workingHours.openTime,
    workingHours.closeTime
  );

  return outside ? "Зачинено" : "Відчинено";
}