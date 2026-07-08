import { apiRequest } from "../../assets/js/api.js";

import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";

import { initLogoutModal } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

/* ==================================================
   ELEMENTS
================================================== */

const els = {

  table:
    document.getElementById("volunteerTable"),

  total:
    document.getElementById("totalRegistered"),

  attended:
    document.getElementById("attendedCount"),

  noShow:
    document.getElementById("noShowCount"),

  searchInput:
    document.getElementById("searchInput"),

  tableCountText:
    document.getElementById("tableCountText"),

  filterBtns:
    document.querySelectorAll(".filter-btn"),

  organizerAvatar:
    document.getElementById("organizerAvatar"),

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

/* ==================================================
   STATE
================================================== */

let organizer = null;

let organizerEvents = [];

let allRegistrations = [];

let currentFilter = "all";

/* ==================================================
   HELPERS
================================================== */

function getVolunteer(registration) {

  return (
    registration.volunteerId ||
    registration.user ||
    {}
  );

}

function getEvent(registration) {

  return organizerEvents.find(
    event =>
      String(event._id) ===
      String(registration.eventId)
  );

}

function getVolunteerName(registration) {

  return (
    getVolunteer(registration).fullName ||
    "Unknown Volunteer"
  );

}

function getVolunteerEmail(registration) {

  return (
    getVolunteer(registration).email ||
    "—"
  );

}

function getVolunteerAvatar(registration) {

  return (
    getVolunteer(registration).profileImage ||
    "https://i.pravatar.cc/100?img=12"
  );

}

function getEventName(registration) {

  const event =
    getEvent(registration);

  return event?.name || "Unknown Event";

}

function getRegistrationStatus(registration) {

  return String(
    registration.status || ""
  ).toLowerCase();

}

function isAttended(registration) {

  return (
    getRegistrationStatus(registration) ===
    "attended"
  );

}

function getQualification(registration) {

  return isAttended(registration)
    ? "Qualified for certificate"
    : "Pending attendance";

}
/* ==================================================
   STATS
================================================== */

function renderStats() {

  const total =
    allRegistrations.length;

  const attended =
    allRegistrations.filter(
      registration => isAttended(registration)
    ).length;

  const pending =
    total - attended;

  els.total.textContent = total;

  els.attended.textContent = attended;

  els.noShow.textContent = pending;

}

/* ==================================================
   TABLE
================================================== */

function renderTable() {

  const query =
    els.searchInput.value
      .trim()
      .toLowerCase();

  let registrations =
    [...allRegistrations];

  /* ---------- FILTER ---------- */

  switch (currentFilter) {

    case "confirmed":

      registrations =
        registrations.filter(
          registration =>
            getRegistrationStatus(registration) ===
            "registered"
        );

      break;

    case "attended":

      registrations =
        registrations.filter(
          registration =>
            isAttended(registration)
        );

      break;

    default:
      break;

  }

  /* ---------- SEARCH ---------- */

  if (query) {

    registrations =
      registrations.filter(registration => {

        const searchable = `
          ${getVolunteerName(registration)}
          ${getVolunteerEmail(registration)}
          ${getEventName(registration)}
          ${getQualification(registration)}
        `.toLowerCase();

        return searchable.includes(query);

      });

  }

  els.tableCountText.textContent =
    `Showing ${registrations.length} of ${allRegistrations.length} entries`;

  if (!registrations.length) {

    els.table.innerHTML = `
      <tr>
        <td colspan="6">
          No volunteers found.
        </td>
      </tr>
    `;

    return;

  }

  els.table.innerHTML =
    registrations
      .map(registration => {

        const attended =
          isAttended(registration);

        return `

          <tr>

            <td>

              <div class="volunteer-name">

                <img
                  class="avatar"
                  src="${getVolunteerAvatar(registration)}"
                  alt="${getVolunteerName(registration)}"
                />

                <div>

                  <strong>
                    ${getVolunteerName(registration)}
                  </strong>

                  <div class="event-name">
                    ${getEventName(registration)}
                  </div>

                </div>

              </div>

            </td>

            <td>
              ${getVolunteerEmail(registration)}
            </td>

            <td>

              <span class="badge confirmed">

                Registered

              </span>

            </td>

            <td>

              <button
                class="attendance-box ${attended ? "checked" : ""}"
                data-id="${registration._id}"
              >

                ${
                  attended
                    ? '<i class="fa-solid fa-check"></i>'
                    : ""
                }

              </button>

            </td>

            <td class="${
              attended
                ? "qualified"
                : "pending"
            }">

              ${
                attended
                  ? "Qualified for certificate"
                  : "Pending attendance"
              }

            </td>

            <td>

              <button
                type="button"
                class="row-action"
              >

                <i class="fa-solid fa-ellipsis"></i>

              </button>

            </td>

          </tr>

        `;

      })
      .join("");

  attachAttendanceHandlers();

}

/* ==================================================
   ATTENDANCE
================================================== */

function attachAttendanceHandlers() {

  document
    .querySelectorAll(".attendance-box")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const registrationId =
            button.dataset.id;

          const registration =
            allRegistrations.find(
              item =>
                String(item._id) ===
                String(registrationId)
            );

          if (!registration) return;

          if (isAttended(registration)) {
            return;
          }

          try {

            button.disabled = true;

            await apiRequest(

              `/applications/registrations/${registrationId}/attendance`,

              {
                method: "PATCH",

                body: JSON.stringify({

                  status: "attended"

                })

              }

            );

            registration.status =
              "attended";

            renderStats();

            renderTable();

          } catch (error) {

            console.error(error);

            alert(
              error.message ||
              "Failed to update attendance."
            );

            button.disabled = false;

          }

        }

      );

    });

}

/* ==================================================
   LOAD DATA
================================================== */

async function loadVolunteers() {

  /* ---------- Load Events ---------- */

  organizerEvents =
    await apiRequest("/events/my-events");

  organizerEvents =
    organizerEvents.events ||
    organizerEvents.data ||
    organizerEvents ||
    [];

  allRegistrations = [];

  /* ---------- Load registrations ---------- */

  for (const event of organizerEvents) {

    try {

      const response =
        await apiRequest(

          `/applications/events/${event._id}/registrations`

        );

      const registrations =
        response.data ||
        response.registrations ||
        response ||
        [];

      registrations.forEach(registration => {

        registration.eventId =
          event._id;

      });

      allRegistrations.push(
        ...registrations
      );

    } catch (error) {

      console.warn(

        `Unable to load registrations for ${event.name}`,

        error.message

      );

    }

  }

  renderStats();

  renderTable();

}
/* ==================================================
   FILTERS
================================================== */

function bindFilters() {

  els.filterBtns.forEach(button => {

    button.addEventListener("click", () => {

      els.filterBtns.forEach(btn =>
        btn.classList.remove("active")
      );

      button.classList.add("active");

      currentFilter =
        button.dataset.filter;

      renderTable();

    });

  });

}

/* ==================================================
   SEARCH
================================================== */

function bindSearch() {

  els.searchInput?.addEventListener(
    "input",
    renderTable
  );

}

/* ==================================================
   UI
================================================== */

function bindUI() {

  bindFilters();

  bindSearch();

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

      if (!organizer) {
        return;
      }

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
          document.getElementById("logoutModal"),

        closeLogoutModal:
          document.getElementById("closeLogoutModal"),

        cancelLogout:
          document.getElementById("cancelLogout"),

        confirmLogout:
          document.getElementById("confirmLogout"),

        redirectTo:
          ROUTES.organizerLogin

      });

      /* ---------------- UI ---------------- */

      bindUI();

      /* ---------------- DATA ---------------- */

      await loadVolunteers();

    } catch (error) {

      console.error(
        "Failed to initialize Volunteers:",
        error
      );

      els.table.innerHTML = `
        <tr>
          <td colspan="6">
            Failed to load volunteers.
          </td>
        </tr>
      `;

    }

  }
);