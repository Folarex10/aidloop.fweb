import { apiRequest } from "../../assets/js/api.js";
import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";
import { ROUTES } from "../../assets/js/config.js";
import { initLogoutModal } from "../../assets/js/logout.js";
import {
  formatDate,
  getLocationText
} from "../../assets/js/utils.js";

/* ==================================================
   ELEMENTS
================================================== */

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

  organizerAvatar:
    document.getElementById("organizerAvatar"),

  editBtn:
    document.getElementById("editBtn"),

  cancelBtn:
    document.getElementById("cancelBtn"),

  logoutBtn:
    document.getElementById("logoutBtn"),

  logoutModal:
    document.getElementById("logoutModal"),

  closeLogoutModal:
    document.getElementById("closeLogoutModal"),

  cancelLogout:
    document.getElementById("cancelLogout"),

  confirmLogout:
    document.getElementById("confirmLogout")

};

const eventId =
  new URLSearchParams(window.location.search)
    .get("id");

let organizer = null;

let eventData = null;

/* ==================================================
   STATUS
================================================== */

function getEventStatus(event) {

  const raw =
    String(event.status || "").toLowerCase();

  switch (raw) {

    case "draft":
      return "draft";

    case "published":
      return "published";

    case "completed":
      return "completed";

    case "cancelled":
    case "canceled":
      return "cancelled";

    default:
      return "draft";

  }

}

function renderStatus(status) {

  els.statusBadge.textContent = status;

  els.statusBadge.className =
    `status-badge status-${status}`;

}

/* ==================================================
   RENDER EVENT
================================================== */

function renderEvent() {

  if (!eventData) return;

  els.name.textContent =
    eventData.name || "Untitled Event";

  els.image.src =
    eventData.image ||
    "../../assets/Images/volunteer.png";

  els.description.textContent =
    eventData.description ||
    "No description available.";

  els.time.textContent =
    `${eventData.startTime || "--"} - ${eventData.endTime || "--"}`;

  els.date.textContent =
    formatDate(eventData.date, "long");

  els.location.textContent =
    getLocationText(eventData);

  renderStatus(
    getEventStatus(eventData)
  );

  els.requirements.innerHTML =
    (eventData.requirements || [])
      .map(req => `<li>${req}</li>`)
      .join("");

  const registered =
    eventData.registeredCount || 0;

  const slots =
    eventData.volunteerSlots || 0;

  els.totalSlots.textContent =
    slots;

  els.registered.textContent =
    registered;

  els.remaining.textContent =
    Math.max(slots - registered, 0);

}
/* ==================================================
   LOAD EVENT
================================================== */

async function loadEvent() {

  if (!eventId) {

    els.name.textContent =
      "Invalid Event";

    return;
  }

  try {

    const response =
      await apiRequest(`/events/${eventId}`);

    eventData =
      response.data || response.event || response;

    renderEvent();

  } catch (error) {

    console.error(
      "Failed to load event:",
      error
    );

    els.name.textContent =
      "Unable to load event";

    els.description.textContent =
      error.message ||
      "Something went wrong while loading this event.";

  }

}

/* ==================================================
   LOAD VOLUNTEERS
================================================== */

async function loadVolunteers() {

  try {

    const response =
      await apiRequest(
        `/applications/events/${eventId}/registrations`
      );

    const volunteers =
      response.data ||
      response.registrations ||
      response ||
      [];

    if (!Array.isArray(volunteers) || !volunteers.length) {

      els.table.innerHTML = `
        <tr>
          <td colspan="4">
            No volunteers have registered yet.
          </td>
        </tr>
      `;

      return;
    }

    els.table.innerHTML =
      volunteers
        .map((volunteer) => {

          const user =
            volunteer.user ||
            volunteer.volunteer ||
            volunteer.volunteerId ||
            {};

          return `
            <tr>

              <td>
                ${user.fullName || "-"}
              </td>

              <td>
                ${user.email || "-"}
              </td>

              <td>
                ${formatDate(
                  volunteer.createdAt,
                  "long"
                )}
              </td>

              <td>

                <span class="status-badge status-published">
                  Registered
                </span>

              </td>

            </tr>
          `;

        })
        .join("");

  } catch (error) {

    console.error(
      "Failed to load volunteers:",
      error
    );

    els.table.innerHTML = `
      <tr>
        <td colspan="4">
          Unable to load volunteers.
        </td>
      </tr>
    `;

  }

}

/* ==================================================
   ACTIONS
================================================== */

function editEvent() {

  if (!eventId) return;

  window.location.href =
    `${ROUTES.organizerCreateEvent}?id=${eventId}`;

}

function cancelEvent() {

  if (!eventId) return;

  window.location.href =
    `${ROUTES.organizerCancelEvent}?id=${eventId}`;

}
/* ==================================================
   UI
================================================== */

function bindUI() {

  els.editBtn?.addEventListener(
    "click",
    editEvent
  );

  els.cancelBtn?.addEventListener(
    "click",
    cancelEvent
  );

}

/* ==================================================
   INIT
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      /* ---------------- AUTH ---------------- */

      organizer =
        await requireOrganizer();

      if (!organizer) return;

      /* ---------------- PROFILE ---------------- */

      await loadOrganizerProfile({

        avatarEl:
          els.organizerAvatar

      });

      /* ---------------- LOGOUT ---------------- */

      initLogoutModal({

        logoutBtn:
          els.logoutBtn,

        logoutModal:
          els.logoutModal,

        closeLogoutModal:
          els.closeLogoutModal,

        cancelLogout:
          els.cancelLogout,

        confirmLogout:
          els.confirmLogout,

        redirectTo:
          ROUTES.organizerLogin

      });

      /* ---------------- UI ---------------- */

      bindUI();

      /* ---------------- DATA ---------------- */

      await loadEvent();

      await loadVolunteers();

    } catch (error) {

      console.error(
        "Failed to initialize Event Details:",
        error
      );

      els.name.textContent =
        "Unable to load page.";

      els.description.textContent =
        error.message ||
        "Something went wrong.";

    }

  }
);