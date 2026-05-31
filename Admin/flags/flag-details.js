import { apiRequest } from "../../assets/js/api.js";
import { normalizeArray } from "../../assets/js/utils.js";

import {
  getEventTitle,
  formatDate
} from "../../assets/js/admin/admin-events.js";

import {
  getFlaggedEvents
} from "../../assets/js/admin/admin-flags.js";

/* ---------------- ELEMENTS ---------------- */

const els = {
  closeBtn: document.getElementById("closeBtn"),
  orgTitle: document.getElementById("orgTitle"),
  severityBadge: document.getElementById("severityBadge"),
  orgName: document.getElementById("orgName"),
  flagReason: document.getElementById("flagReason"),
  lastEventCancelled: document.getElementById("lastEventCancelled"),
  description: document.getElementById("description"),
  feedback: document.getElementById("feedback"),
  contactBtn: document.getElementById("contactBtn")
};

const organizerId = new URLSearchParams(window.location.search).get("id");

let currentOrganizer = null;

/* ---------------- HELPERS ---------------- */

function getOrganizerName(user) {
  return user.fullName || user.name || user.organizationName || "Organization";
}

function getSeverity(count) {
  if (count <= 1) return "low";
  if (count <= 3) return "medium";
  return "high";
}

function setSeverity(count) {
  const severity = getSeverity(count);

  els.severityBadge.textContent =
    severity.charAt(0).toUpperCase() + severity.slice(1);

  els.severityBadge.className = "severity-badge";
  els.severityBadge.classList.add(severity);
}

function setFeedback(msg, type = "") {
  els.feedback.textContent = msg;
  els.feedback.className = "feedback";
  if (type) els.feedback.classList.add(type);
}

/* ---------------- LOAD ---------------- */

async function loadFlagDetails() {
  if (!organizerId) {
    setFeedback("Invalid flag link", "error");
    return;
  }

  try {
    const [usersPayload, eventsPayload] = await Promise.all([
      apiRequest("/user").catch(() => apiRequest("/users")),
      apiRequest("/events")
    ]);

    const users = normalizeArray(usersPayload, ["users"]);
    const events = normalizeArray(eventsPayload, ["events"]);

    const organizer = users.find(
      (u) => String(u._id || u.id) === String(organizerId)
    );

    if (!organizer) {
      throw new Error("Organizer not found");
    }

    currentOrganizer = organizer;

    const flaggedMap = getFlaggedEvents();

    // 🔥 get all flagged events for this organizer
    const organizerEvents = events.filter((event) => {
      const orgId =
        event.organizer?._id ||
        event.organizer?.id ||
        event.organizerId;

      return String(orgId) === String(organizerId);
    });

    const flaggedEvents = organizerEvents.filter(
      (event) => flaggedMap[event._id || event.id]
    );

    // fallback → cancelled events if no explicit flags
    const cancelledEvents = organizerEvents.filter((event) => {
      const status = String(event.status || "").toLowerCase();
      return status.includes("cancel");
    });

    const finalEvents =
      flaggedEvents.length > 0 ? flaggedEvents : cancelledEvents;

    if (!finalEvents.length) {
      throw new Error("No flagged records found");
    }

    // latest event
    const latest = finalEvents.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    )[0];

    /* ---------------- POPULATE ---------------- */

    els.orgTitle.textContent = getOrganizerName(organizer);
    els.orgName.textContent = getOrganizerName(organizer);

    els.flagReason.textContent =
      flaggedMap[latest._id || latest.id]?.reason ||
      latest.cancelReason ||
      "Flagged activity detected";

    els.lastEventCancelled.textContent = `
      ${getEventTitle(latest)} • ${formatDate(
      latest.date || latest.updatedAt || latest.createdAt
    )}
    `;

    els.description.textContent =
      organizer.description ||
      organizer.bio ||
      "No organizer description available.";

    setSeverity(finalEvents.length);

  } catch (err) {
    els.orgTitle.textContent = "Error loading flag details";
    setFeedback(err.message || "Failed to load", "error");
    els.contactBtn.disabled = true;
  }
}

/* ---------------- CONTACT ---------------- */

function contactOrganizer() {
  if (!currentOrganizer) return;

  const name = getOrganizerName(currentOrganizer);
  const email = currentOrganizer.email;

  if (!email) {
    setFeedback("No email available", "error");
    return;
  }

  const subject = encodeURIComponent(`AidLoop Flag Review - ${name}`);
  const body = encodeURIComponent(
    `Hello ${name},

We are contacting you regarding flagged activity on your events.

Please provide clarification.

Thank you.`
  );

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  setFeedback("Opening email...", "success");
}

/* ---------------- CLOSE ---------------- */

function closeModal() {
  window.location.href = "flags.html";
}

/* ---------------- INIT ---------------- */

function bindUI() {
  els.closeBtn?.addEventListener("click", closeModal);
  els.contactBtn?.addEventListener("click", contactOrganizer);
}

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  loadFlagDetails();
});