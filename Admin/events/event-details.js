import {
  fetchEventById,
  getEventStatus,
  getStatusLabel
} from "../../assets/js/admin/admin-events.js";

import { flagEventApi } from "../../assets/js/admin/admin-flags.js";

/* ---------------- ELEMENTS ---------------- */

const els = {
  eventTitle: document.getElementById("eventTitle"),
  statusBadge: document.getElementById("statusBadge"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  dateTime: document.getElementById("dateTime"),
  slotsFilled: document.getElementById("slotsFilled"),
  description: document.getElementById("description"),
  feedback: document.getElementById("feedback"),
  closeBtn: document.getElementById("closeBtn"),
  flagBtn: document.getElementById("flagBtn")
};

const eventId = new URLSearchParams(window.location.search).get("id");
let currentEvent = null;

/* ---------------- HELPERS ---------------- */

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatTime(value) {
  if (!value) return "";
  const [h, m] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;

  return `${normalized}:${m} ${suffix}`;
}

function setStatusBadge(event) {
  const status = getEventStatus(event);

  els.statusBadge.textContent = getStatusLabel(status);
  els.statusBadge.className = "status-badge";
  els.statusBadge.classList.add(status);

  // 🔥 Disable flag if cancelled
  if (status === "cancelled") {
    els.flagBtn.disabled = true;
    els.flagBtn.textContent = "Event Cancelled";
  }
}

function renderSocial(link) {
  if (!link) {
    els.socialLinks.textContent = "—";
    return;
  }

  els.socialLinks.innerHTML = `
    <a href="${link}" target="_blank">${link}</a>
  `;
}

function populateEvent(event) {
  els.eventTitle.textContent = event.name || "Untitled Event";

  setStatusBadge(event);

  els.orgName.textContent =
    event.organizer?.name ||
    event.organizer?.fullName ||
    "—";

  els.email.textContent =
    event.organizer?.email || event.email || "—";

  els.phoneNumber.textContent =
    event.organizer?.phone || event.phone || "—";

  renderSocial(
    event.organizer?.website ||
    event.socialLinks?.[0]
  );

  const date = formatDate(event.date);
  const start = formatTime(event.startTime);
  const end = formatTime(event.endTime);

  els.dateTime.textContent =
    start && end
      ? `${date} • ${start} - ${end}`
      : date;

  const filled = event.filledSlots || 0;
  const total = event.volunteerSlots || 0;

  els.slotsFilled.textContent = `${filled} / ${total}`;

  els.description.textContent =
    event.description || "No description available.";

  // 🔥 If already flagged
  if (event.isFlagged) {
    els.flagBtn.disabled = true;
    els.flagBtn.textContent = "Already Flagged";
  }
}

function setFeedback(msg, type = "") {
  els.feedback.textContent = msg;
  els.feedback.className = "feedback";
  if (type) els.feedback.classList.add(type);
}

/* ---------------- LOAD ---------------- */

async function loadEventDetails() {
  if (!eventId) {
    setFeedback("Invalid event link", "error");
    setTimeout(() => {
      window.location.href = "events-oversight.html";
    }, 1500);
    return;
  }

  try {
    currentEvent = await fetchEventById(eventId);
    populateEvent(currentEvent);
  } catch (err) {
    setFeedback(err.message || "Failed to load event", "error");
  }
}

/* ---------------- FLAG ---------------- */

async function handleFlag() {
  if (!eventId) return;

  try {
    els.flagBtn.disabled = true;
    els.flagBtn.textContent = "Flagging...";

    await flagEventApi(eventId);

    setFeedback("Event flagged successfully", "success");

    els.flagBtn.textContent = "Flagged";
  } catch (err) {
    setFeedback(err.message || "Failed to flag event", "error");

    els.flagBtn.disabled = false;
    els.flagBtn.textContent = "Flag Event";
  }
}

/* ---------------- CLOSE ---------------- */

function closeModal() {
  window.location.href = "events-oversight.html";
}

/* ---------------- INIT ---------------- */

function bindUI() {
  els.closeBtn?.addEventListener("click", closeModal);
  els.flagBtn?.addEventListener("click", handleFlag);
}

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  loadEventDetails();
});