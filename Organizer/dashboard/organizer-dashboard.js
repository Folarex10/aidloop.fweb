import { apiRequest } from "../../assets/js/api.js";
import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";
import { initLogoutModal } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";
import {  normalizeArray, formatDate, getLocationText } from "../../assets/js/utils.js";

const els = {
  totalEvents: document.getElementById("totalEvents"),
  upcomingEvents: document.getElementById("upcomingEvents"),
  completedEvents: document.getElementById("completedEvents"),
  totalVolunteers: document.getElementById("totalVolunteers"),
  eventsTable: document.getElementById("eventsTable"),
  emptyState: document.getElementById("emptyState"),

  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let organizer = null;
let eventsCache = [];

/* ==================================================
   STATUS
================================================== */

function getEventStatus(event) {

  const raw = String(event.status || "").toLowerCase();

  if (raw === "draft") return "draft";

  if (raw === "cancelled" || raw === "canceled") {
    return "cancelled";
  }

  const eventDate = event.date
    ? new Date(event.date)
    : null;

  if (
    raw === "published" &&
    eventDate &&
    eventDate < new Date()
  ) {
    return "completed";
  }

  return "published";
}

/* ==================================================
   RENDER
================================================== */

function renderDashboard() {

  if (!eventsCache.length) {

    els.eventsTable.innerHTML = "";

    if (els.emptyState) {
      els.emptyState.style.display = "block";
    }

    els.totalEvents.textContent = "0";
    els.upcomingEvents.textContent = "0";
    els.completedEvents.textContent = "0";
    els.totalVolunteers.textContent = "0";

    return;
  }

  if (els.emptyState) {
    els.emptyState.style.display = "none";
  }

  const sortedEvents = [...eventsCache].sort(
    (a, b) =>
      new Date(b.createdAt || b.date || 0) -
      new Date(a.createdAt || a.date || 0)
  );

  const totalVolunteers = sortedEvents.reduce(
    (sum, event) =>
      sum + (
        event.filledSlots ??
        event.registrationsCount ??
        event.registeredCount ??
        0
      ),
    0
  );

  els.totalEvents.textContent =
    sortedEvents.length;

  els.upcomingEvents.textContent =
    sortedEvents.filter(
      (e) => getEventStatus(e) === "published"
    ).length;

  els.completedEvents.textContent =
    sortedEvents.filter(
      (e) => getEventStatus(e) === "completed"
    ).length;

  els.totalVolunteers.textContent =
    totalVolunteers;

  els.eventsTable.innerHTML = sortedEvents
    .slice(0, 5)
    .map((event) => {

      const status = getEventStatus(event);

      return `
        <tr>
          <td>${event.name || "Untitled Event"}</td>

          <td>${getLocationText(event)}</td>

          <td>${formatDate(event.date, "long")}</td>

          <td>
            ${
              event.filledSlots ??
              event.registrationsCount ??
              event.registeredCount ??
              0
            }
            /
            ${event.volunteerSlots ?? 0}
          </td>

          <td>
            <span class="status-badge status-${status}">
              ${status}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

/* ==================================================
   LOAD
================================================== */

async function loadDashboard() {

  try {

    organizer = await requireOrganizer();

    await loadOrganizerProfile({
  nameEl: document.getElementById("organizerName"),
  roleEl: document.getElementById("organizerRole"),
  avatarEl: document.getElementById("organizerAvatar")
});



   
    if (!organizer) {
      return;
    }

    const payload =
      await apiRequest("/events/my-events");

    const allEvents =
      normalizeArray(payload, ["events"]);


    const organizerId = String(
      organizer._id ||
      organizer.id ||
      ""
    );


    eventsCache = allEvents.filter((event) => {

  // Backend currently stores owner here
  if (typeof event.organizationId === "string") {
    return event.organizationId === organizerId;
  }

  // Sometimes populated
  if (
    event.organizationId &&
    typeof event.organizationId === "object"
  ) {
    return (
      String(
        event.organizationId._id ||
        event.organizationId.id ||
        ""
      ) === organizerId
    );
  }

  // Future-proof support
  if (
    event.organizer &&
    typeof event.organizer === "object"
  ) {
    return (
      String(
        event.organizer._id ||
        event.organizer.id ||
        ""
      ) === organizerId
    );
  }

  return (
    String(
      event.organizerId || ""
    ) === organizerId
  );
});

    renderDashboard();

  } catch (error) {

    console.error(
      "Failed to load dashboard:",
      error.message
    );

    els.eventsTable.innerHTML = `
      <tr>
        <td colspan="5">
          Failed to load dashboard data.
        </td>
      </tr>
    `;
  }
}

function bindUI() {

  initLogoutModal({
    redirectTo: ROUTES.organizerLogin
  });

}

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    bindUI();

    await loadDashboard();

    organizer = await requireOrganizer();
  }
);
