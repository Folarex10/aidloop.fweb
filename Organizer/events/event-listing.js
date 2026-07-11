import { apiRequest } from "../../assets/js/api.js";

import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";

import { initLogoutModal } from "../../assets/js/logout.js";

import { ROUTES } from "../../assets/js/config.js";

import {
  normalizeArray,
  formatDate,
  getLocationText
} from "../../assets/js/utils.js";

/* ==========================================================
   ELEMENTS
========================================================== */

const els = {
  table: document.getElementById("eventsTable"),

  emptyState: document.getElementById("emptyState"),

  filterButtons: document.querySelectorAll(".filter-btn"),

  logoutBtn: document.getElementById("logoutBtn"),
  // logoutModal: document.getElementById("logoutModal"),
  // closeLogoutModal: document.getElementById("closeLogoutModal"),
  // cancelLogout: document.getElementById("cancelLogout"),
  // confirmLogout: document.getElementById("confirmLogout"),

  organizerAvatar: document.getElementById("organizerAvatar")
};

/* ==========================================================
   STATE
========================================================== */

let organizer = null;

let eventsCache = [];

let currentFilter = "all";

/* ==========================================================
   STATUS
========================================================== */

function getEventStatus(event) {

  const raw = String(event.status || "").toLowerCase();

  if (raw === "draft") return "draft";

  if (
    raw === "cancelled" ||
    raw === "canceled"
  ) {
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

/* ==========================================================
   ACTIONS
========================================================== */

function renderActions(event) {

  const status = getEventStatus(event);

  const id = encodeURIComponent(
    event._id || event.id
  );

  let html = `
      <a class="action-link"
         href="event-details.html?id=${id}">
         View
      </a>
  `;

  if (status === "draft") {

    html += `
      <a class="action-link"
         href="create-event.html?id=${id}">
         Edit
      </a>

      <button
        class="action-btn publish-btn"
        data-id="${id}">
        Publish
      </button>

      <button
        class="action-btn delete-btn"
        data-id="${id}">
        Delete
      </button>
    `;
  }

  if (status === "published") {

    html += `
      <button
        class="action-btn cancel-btn"
        data-id="${id}">
        Cancel
      </button>
    `;
  }

  return html;
}

/* ==========================================================
   TABLE
========================================================== */

function renderTable(events) {

  if (!events.length) {

    els.table.innerHTML = `
      <tr>
        <td colspan="6">
          No events found.
        </td>
      </tr>
    `;

    return;
  }

  const sorted = [...events].sort(

    (a, b) =>

      new Date(
        b.createdAt || b.date || 0
      ) -

      new Date(
        a.createdAt || a.date || 0
      )

  );

  els.table.innerHTML = sorted.map(event => {

    const status = getEventStatus(event);

    return `

      <tr>

        <td>
          ${event.name || "Untitled Event"}
        </td>

        <td>
          ${getLocationText(event)}
        </td>

        <td>
          ${formatDate(event.date, "long")}
        </td>

        <td>

          ${

            event.registeredCount ??

            event.filledSlots ??

            event.registrationsCount ??

            0

          }

          /

          ${event.volunteerSlots ?? 0}

        </td>

        <td>

          <span
            class="status-badge status-${status}">
            ${status}
          </span>

        </td>

        <td>

          ${renderActions(event)}

        </td>

      </tr>

    `;

  }).join("");

}

/* ==========================================================
   LOAD EVENTS
========================================================== */

async function loadEvents() {

  try {

    organizer = await requireOrganizer();

    if (!organizer) return;

    await loadOrganizerProfile({
      avatarEl: els.organizerAvatar
    });

    const payload = await apiRequest("/events/my-events");

    const allEvents = normalizeArray(payload, ["events"]);

    const organizerId = String(
      organizer._id ||
      organizer.id ||
      ""
    );

    eventsCache = allEvents.filter((event) => {

      if (typeof event.organizationId === "string") {
        return event.organizationId === organizerId;
      }

      if (
        event.organizationId &&
        typeof event.organizationId === "object"
      ) {
        return String(
          event.organizationId._id ||
          event.organizationId.id ||
          ""
        ) === organizerId;
      }

      if (
        event.organizer &&
        typeof event.organizer === "object"
      ) {
        return String(
          event.organizer._id ||
          event.organizer.id ||
          ""
        ) === organizerId;
      }

      return (
        String(event.organizerId || "") ===
        organizerId
      );

    });

    applyFilter();

  } catch (error) {

    console.error(error);

    els.table.innerHTML = `
      <tr>
        <td colspan="6">
          Failed to load events.
        </td>
      </tr>
    `;

  }

}

/* ==========================================================
   FILTERS
========================================================== */

function applyFilter() {

  if (currentFilter === "all") {

    renderTable(eventsCache);

    return;
  }

  const filtered = eventsCache.filter(event =>

    getEventStatus(event) === currentFilter

  );

  renderTable(filtered);

}

/* ==========================================================
   EVENT ACTIONS
========================================================== */

async function publishEvent(id) {

  try {

    await apiRequest(`/events/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "published"
      })
    });

    await loadEvents();

  } catch (error) {

    alert(error.message);

  }

}

async function deleteEvent(id) {

  if (!confirm("Delete this draft event?")) {
    return;
  }

  try {

    await apiRequest(`/events/${id}`, {
      method: "DELETE"
    });

    await loadEvents();

  } catch (error) {

    alert(error.message);

  }

}

async function cancelEvent(id) {

  const reason = prompt(
    "Reason for cancellation:"
  );

  if (!reason) return;

  try {

    await apiRequest(`/events/${id}/cancel`, {

      method: "PATCH",

      body: JSON.stringify({

        reason

      })

    });

    await loadEvents();

  } catch (error) {

    alert(error.message);

  }

}

/* ==========================================================
   UI
========================================================== */

function bindUI() {

  /* ---------- FILTER BUTTONS ---------- */

  els.filterButtons.forEach(button => {

    button.addEventListener("click", () => {

      els.filterButtons.forEach(btn =>
        btn.classList.remove("active")
      );

      button.classList.add("active");

      currentFilter = button.dataset.filter;

      applyFilter();

    });

  });

  /* ---------- TABLE ACTIONS ---------- */

  els.table.addEventListener("click", async (event) => {

    const button = event.target.closest("button");

    if (!button) return;

    const id = button.dataset.id;

    if (!id) return;

    if (button.classList.contains("publish-btn")) {

      await publishEvent(id);

      return;

    }

    if (button.classList.contains("delete-btn")) {

      await deleteEvent(id);

      return;

    }

    if (button.classList.contains("cancel-btn")) {

      await cancelEvent(id);

    }

  });

  /* ---------- CENTRALIZED LOGOUT ---------- */

  // initLogoutModal({

  //   logoutBtn: els.logoutBtn,

  //   logoutModal: els.logoutModal,

  //   closeLogoutModal: els.closeLogoutModal,

  //   cancelLogout: els.cancelLogout,

  //   confirmLogout: els.confirmLogout,

  //   redirectTo: ROUTES.organizerLogin

  // });

  initLogoutModal({

    triggerSelector: "#logoutBtn",

    message:
        "You are about to end your current organizer session.",

    redirectTo:
        ROUTES.organizerLogin

});

}

/* ==========================================================
   INIT
========================================================== */

document.addEventListener(

  "DOMContentLoaded",

  async () => {

    bindUI();

    await loadEvents();

  }

);