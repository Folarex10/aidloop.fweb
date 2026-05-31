import { apiRequest } from "../api.js";
import { normalizeArray } from "../utils.js";

/* ---------------- NORMALIZATION ---------------- */

export function normalizeEvents(payload) {
  return normalizeArray(payload, ["events"]);
}

/* ---------------- BASIC GETTERS ---------------- */

export function getEventId(event) {
  return event._id || event.id || "";
}

export function getEventTitle(event) {
  return event.name || event.title || "Untitled Event";
}

export function getContactEmail(event) {
  return (
    event.organizer?.email ||
    event.contactEmail ||
    event.email ||
    "—"
  );
}

/* ---------------- LOCATION ---------------- */

export function formatLocation(event) {
  if (typeof event.location === "string" && event.location.trim()) {
    return event.location;
  }

  if (event.location && typeof event.location === "object") {
    return (
      [event.location.venue, event.location.city || event.location.state]
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  return event.city || event.state || "—";
}

/* ---------------- STATUS ---------------- */

// export function getEventStatus(event) {
//   const status = String(event.status || "").toLowerCase();

//   if (status.includes("cancel")) return "cancelled";
//   if (status.includes("draft")) return "draft";
//   return "published";
// }

// export function getStatusLabel(status) {
//   return status.charAt(0).toUpperCase() + status.slice(1);
// }

export function getEventStatus(event) {
  const status = String(event.status || "").toLowerCase();

  if (status.includes("cancel")) return "cancelled";

  // fallback: detect from cancelReason
  if (event.cancelReason) return "cancelled";

  if (status.includes("draft")) return "draft";

  return "published";
}

/* ---------------- DATE / TIME ---------------- */

export function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export function formatTime(value) {
  if (!value) return "";

  if (String(value).includes("AM") || String(value).includes("PM")) {
    return value;
  }

  const [hours, minutes] = String(value).split(":");
  if (!hours || !minutes) return value;

  const hourNum = Number(hours);
  const suffix = hourNum >= 12 ? "PM" : "AM";
  const normalizedHour = hourNum % 12 || 12;

  return `${normalizedHour}:${minutes} ${suffix}`;
}

/* ---------------- SLOTS ---------------- */

export function getSlotsFilled(event) {
  const filled =
    event.filledSlots ??
    event.registrationsCount ??
    event.registeredCount ??
    event.attendeesCount ??
    0;

  const total =
    event.volunteerSlots ??
    event.slots ??
    0;

  return `${filled} / ${total}`;
}

/* ---------------- SORT ---------------- */

export function sortEventsNewest(events) {
  return [...events].sort((a, b) => {
    const aTime = new Date(
      a.createdAt || a.updatedAt || a.date || 0
    ).getTime();

    const bTime = new Date(
      b.createdAt || b.updatedAt || b.date || 0
    ).getTime();

    return bTime - aTime;
  });
}

/* ---------------- FETCH ---------------- */

export async function fetchEvents() {
  const payload = await apiRequest("/events");
  return sortEventsNewest(normalizeEvents(payload));
}

export async function fetchEventById(eventId) {
  if (!eventId) {
    throw new Error("No event ID provided");
  }

  return await apiRequest(`/events/${eventId}`);
}

/* ---------------- FILTER ---------------- */

export function filterEvents(events, filter = "all", query = "") {
  const q = query.trim().toLowerCase();

  return events.filter((event) => {
    const status = getEventStatus(event);

    const matchesFilter =
      filter === "all" ? true : status === filter;

    const searchable = `
      ${getEventTitle(event)}
      ${getContactEmail(event)}
      ${formatLocation(event)}
      ${status}
    `.toLowerCase();

    return matchesFilter && searchable.includes(q);
  });
}

/* ---------------- ORGANIZER HELPERS ---------------- */

export function getOrganizerName(event) {
  return (
    event.organizer?.fullName ||
    event.organizer?.name ||
    event.organizerName ||
    "—"
  );
}

export function getOrganizerPhone(event) {
  return (
    event.organizer?.phoneNumber ||
    event.organizer?.phone ||
    event.phoneNumber ||
    event.phone ||
    "—"
  );
}

export function getSocialLink(event) {
  return (
    event.organizer?.website ||
    event.organizer?.socialLink ||
    event.organizer?.socialLinks?.[0] ||
    event.website ||
    event.socialLink ||
    event.socialLinks?.[0] ||
    ""
  );
}