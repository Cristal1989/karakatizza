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

function getOpenTimeValue(workingHours) {
  return (
    workingHours?.openTime ||
    workingHours?.openingTime ||
    ""
  );
}

function getCloseTimeValue(workingHours) {
  return (
    workingHours?.closeTime ||
    workingHours?.closingTime ||
    ""
  );
}

function getClosedTodayValue(workingHours) {
  if (typeof workingHours?.closedToday === "boolean") {
    return workingHours.closedToday;
  }

  if (typeof workingHours?.closedAllDay === "boolean") {
    return workingHours.closedAllDay;
  }

  return false;
}

export function getWorkingHoursLabel(workingHours) {
  if (!workingHours) return "";

  const closedToday = getClosedTodayValue(workingHours);
  if (closedToday) {
    return "Сьогодні зачинено";
  }

  const openTime = getOpenTimeValue(workingHours);
  const closeTime = getCloseTimeValue(workingHours);

  if (!openTime || !closeTime) {
    return "";
  }

  return `${openTime} – ${closeTime}`;
}

export function getWorkingStatusLabel(workingHours) {
  if (!workingHours) return "";

  const closedToday = getClosedTodayValue(workingHours);
  if (closedToday) {
    return "Сьогодні зачинено";
  }

  const openTime = getOpenTimeValue(workingHours);
  const closeTime = getCloseTimeValue(workingHours);

  if (!openTime || !closeTime) {
    return "";
  }

  const outside = isOutsideWorkingHours(openTime, closeTime);

  return outside ? "Зачинено" : "Відчинено";
}