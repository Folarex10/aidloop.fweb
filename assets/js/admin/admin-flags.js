import { apiRequest } from "../api.js";

const STORAGE_KEY = "aidloop_flagged_events";

/* ---------------- STORAGE ---------------- */

export function getFlaggedEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAll(flags) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

/* ---------------- FLAG ---------------- */

export function saveFlag(eventId, reason) {
  const flags = getFlaggedEvents();

  flags[eventId] = {
    reason,
    flaggedAt: Date.now()
  };

  saveAll(flags);
}

/* ---------------- AUTO FLAG RULE ---------------- */

export function autoFlagIfRepeatedCancellation(events = []) {
  const flags = getFlaggedEvents();

  const cancelCounts = {};

  events.forEach((event) => {
    const orgId = event.organizer?._id || event.organizer?.id;

    if (!orgId) return;

    if (event.cancelReason || event.status === "cancelled") {
      cancelCounts[orgId] = (cancelCounts[orgId] || 0) + 1;
    }
  });

  Object.entries(cancelCounts).forEach(([orgId, count]) => {
    if (count >= 3) {
      flags[`org-${orgId}`] = {
        reason: "Multiple event cancellations",
        flaggedAt: Date.now(),
        severity: "high"
      };
    }
  });

  saveAll(flags);
}

/* ---------------- API FLAG ---------------- */

export async function flagEventApi(eventId, reason = "Flagged by admin") {
  try {
    await apiRequest(`/events/${eventId}/flag`, {
      method: "PATCH",
      body: JSON.stringify({ reason })
    });
  } catch {
    saveFlag(eventId, reason);
  }
}