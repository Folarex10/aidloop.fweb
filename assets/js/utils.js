export function normalizeUsers(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function normalizeEvents(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function normalizeArray(payload, keys = []) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function getLocationText(item) {

  if (
    typeof item.location === "string" &&
    item.location.trim()
  ) {
    return item.location;
  }

  if (
    item.location &&
    typeof item.location === "object"
  ) {
    return (
      [
        item.location.venue,
        item.location.city ||
        item.location.state
      ]
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  return (
    item.city ||
    item.state ||
    "—"
  );
}