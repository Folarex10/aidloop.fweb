import { apiRequest, normalizeArray } from "../../assets/js/api.js";
import { requireOrganizer } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";
import { formatDate, getLocationText } from "../../assets/js/utils.js";

const els = {
  name: document.getElementById("eventName"),
  image: document.getElementById("eventImage"),
  description: document.getElementById("eventDescription"),
  time: document.getElementById("eventTime"),
  date: document.getElementById("eventDate"),
  location: document.getElementById("eventLocation"),
  requirements: document.getElementById("requirementsList"),
  totalSlots: document.getElementById("totalSlots"),
  registered: document.getElementById("registered"),
  remaining: document.getElementById("remaining"),
  table: document.getElementById("volunteerTable"),
  statusBadge: document.getElementById("statusBadge"),
  cancelBtn: document.getElementById("cancelBtn"),
  editBtn: document.getElementById("editBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  feedback: document.getElementById("feedback") // ✅ added
};

const eventId = new URLSearchParams(window.location.search).get("id");

let eventData = null;

/* ---------------- FEEDBACK ---------------- */

function setFeedback(message, type = "") {
  if (!els.feedback) return;

  els.feedback.textContent = message;
  els.feedback.className = "feedback";

  if (type) {
    els.feedback.classList.add(type);
  }
}

/* ---------------- STATUS ---------------- */

function getEventStatus(event) {
  const raw = String(event.status || "").toLowerCase();

  if (raw === "cancelled" || raw === "canceled") return "cancelled";
  if (raw === "draft") return "draft";

  const eventDate = event.date ? new Date(event.date) : null;

  if (raw === "published" && eventDate && eventDate < new Date()) {
    return "completed";
  }

  return "published";
}

function setStatus(status) {
  if (!els.statusBadge) return;

  els.statusBadge.textContent = status;
  els.statusBadge.className = "status-badge";
  els.statusBadge.classList.add(`status-${status}`);
}

/* ---------------- LOAD EVENT ---------------- */

async function loadEvent() {
  if (!eventId) {
    setFeedback("Invalid event ID.", "error");
    return;
  }

  try {
    setFeedback("Loading event...");

    const payload = await apiRequest("/events");
    const events = normalizeArray(payload, ["events"]);

    eventData = events.find(
      (e) => String(e._id || e.id) === String(eventId)
    );

    if (!eventData) {
      setFeedback("Event not found.", "error");
      return;
    }

    /* Populate UI safely */
    if (els.name) els.name.textContent = eventData.name || "Untitled Event";
    if (els.image) els.image.src = eventData.image || "";

    if (els.description) {
      els.description.textContent =
        eventData.description || "No description available.";
    }

    if (els.time) {
      els.time.textContent = `${eventData.startTime || ""} - ${eventData.endTime || ""}`;
    }

    if (els.date) {
      els.date.textContent = formatDate(eventData.date, "long");
    }

    if (els.location) {
      els.location.textContent = getLocationText(eventData);
    }

    setStatus(getEventStatus(eventData));

    /* Requirements */
    if (els.requirements) {
      els.requirements.innerHTML =
        (eventData.requirements || [])
          .map((r) => `<li>${r}</li>`)
          .join("") || "<li>No requirements</li>";
    }

    /* Stats */
    if (els.totalSlots) {
      els.totalSlots.textContent = eventData.volunteerSlots || 0;
    }

    await loadVolunteers();

    setFeedback("Event loaded successfully.", "success");

  } catch (error) {
    console.error("Load event failed:", error.message);
    setFeedback(error.message || "Failed to load event.", "error");
  }
}

/* ---------------- VOLUNTEERS ---------------- */

async function loadVolunteers() {
  try {
    const data = await apiRequest(
      `/applications/events/${eventId}/registrations`
    );

    const volunteers = Array.isArray(data)
      ? data
      : data?.data || [];

    const count = volunteers.length;

    if (els.registered) els.registered.textContent = count;
    if (els.remaining) {
      els.remaining.textContent =
        (eventData.volunteerSlots || 0) - count;
    }

    if (!count) {
      els.table.innerHTML = `
        <tr><td colspan="4">No volunteers yet</td></tr>
      `;
      return;
    }

    els.table.innerHTML = volunteers
      .map((v) => `
        <tr>
          <td>${v.user?.fullName || "Unknown"}</td>
          <td>${v.user?.email || "—"}</td>
          <td>${formatDate(v.createdAt)}</td>
          <td><span class="status-badge status-published">Confirmed</span></td>
        </tr>
      `)
      .join("");

  } catch (error) {
    console.error("Load volunteers failed:", error.message);

    els.table.innerHTML = `
      <tr><td colspan="4">Failed to load volunteers</td></tr>
    `;
  }
}

/* ---------------- ACTIONS ---------------- */

async function cancelEvent() {
  if (!eventId) return;

  const confirmAction = confirm("Cancel this event?");
  if (!confirmAction) return;

  try {
    if (els.cancelBtn) {
      els.cancelBtn.disabled = true;
      els.cancelBtn.textContent = "Cancelling...";
    }

    await apiRequest(`/events/${eventId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason: "Cancelled by organizer" })
    });

    setFeedback("Event cancelled successfully.", "success");

    setTimeout(() => {
      location.reload();
    }, 800);

  } catch (error) {
    setFeedback(error.message || "Failed to cancel event.", "error");
  } finally {
    if (els.cancelBtn) {
      els.cancelBtn.disabled = false;
      els.cancelBtn.textContent = "Cancel Event";
    }
  }
}

function editEvent() {
  if (!eventId) return;
  window.location.href = `create-event.html?id=${encodeURIComponent(eventId)}`;
}

/* ---------------- INIT ---------------- */

function bindUI() {
  els.logoutBtn?.addEventListener("click", () => {
    logout(ROUTES.organizerLogin);
  });

  els.cancelBtn?.addEventListener("click", cancelEvent);
  els.editBtn?.addEventListener("click", editEvent);
}

document.addEventListener("DOMContentLoaded", async () => {
  const organizer = await requireOrganizer();
  if (!organizer) return;

  bindUI();
  await loadEvent();
});