import { apiRequest } from "../../assets/js/api.js";
import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";

import { initLogoutModal } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  table: document.getElementById("volunteerTable"),

  total: document.getElementById("totalRegistered"),
  attended: document.getElementById("attendedCount"),
  noShow: document.getElementById("noShowCount"),

  searchInput: document.getElementById("searchInput"),
  tableCountText: document.getElementById("tableCountText"),

  filterBtns: document.querySelectorAll(".filter-btn"),

  logoutBtn: document.getElementById("logoutBtn"),

  organizerAvatar: document.getElementById("organizerAvatar")
};

let organizer = null;

let allEvents = [];
let allVolunteers = [];

let currentFilter = "all";

/* ==================================================
   HELPERS
================================================== */

function getVolunteer(v) {
  return v.volunteerId || {};
}

function getDisplayName(v) {
  return getVolunteer(v).fullName || "Unknown Volunteer";
}

function getEmail(v) {
  return getVolunteer(v).email || "—";
}

function getAvatar(v) {
  return (
    getVolunteer(v).profileImage ||
    "https://i.pravatar.cc/100?img=12"
  );
}

function getStatus(v) {
  return String(v.status || "").toLowerCase();
}

function isUpcoming(v) {

  const event = allEvents.find(
    e => String(e._id) === String(v.eventId)
  );

  if (!event) return false;

  return (
    new Date(event.date) >= new Date() &&
    event.status === "published"
  );
}

function getQualification(v) {

  return getStatus(v) === "attended"
    ? "Qualified for certificate"
    : "Pending attendance";

}

/* ==================================================
   STATS
================================================== */

function renderStats() {

  const total = allVolunteers.length;

  const attended =
    allVolunteers.filter(
      v => getStatus(v) === "attended"
    ).length;

  const noShow =
    Math.max(
      0,
      total - attended
    );

  els.total.textContent = total;
  els.attended.textContent = attended;
  els.noShow.textContent = noShow;
}

/* ==================================================
   TABLE
================================================== */

function renderTable() {

  const query =
    els.searchInput.value
      .trim()
      .toLowerCase();

  let volunteers = [...allVolunteers];

  /* ---------- FILTER ---------- */

  switch (currentFilter) {

    case "confirmed":

      volunteers =
        volunteers.filter(
          v => getStatus(v) === "registered"
        );

      break;

    case "upcoming":

      volunteers =
        volunteers.filter(isUpcoming);

      break;

    default:
      break;
  }

  /* ---------- SEARCH ---------- */

  if (query) {

    volunteers =
      volunteers.filter(v => {

        const searchable = `
          ${getDisplayName(v)}
          ${getEmail(v)}
          ${getQualification(v)}
        `.toLowerCase();

        return searchable.includes(query);

      });

  }

  els.tableCountText.textContent =
    `Showing ${volunteers.length} of ${allVolunteers.length} entries`;

  if (!volunteers.length) {

    els.table.innerHTML = `
      <tr>
        <td colspan="6">
          No volunteers found
        </td>
      </tr>
    `;

    return;
  }

  els.table.innerHTML =
    volunteers
      .map(v => {

        const attended =
          getStatus(v) === "attended";

        return `
          <tr>

            <td>

              <div class="volunteer-name">

                <img
                  class="avatar"
                  src="${getAvatar(v)}"
                  alt="${getDisplayName(v)}"
                />

                <span>${getDisplayName(v)}</span>

              </div>

            </td>

            <td>${getEmail(v)}</td>

            <td>

              <span class="badge confirmed">
                Registered
              </span>

            </td>

            <td>

              <button
                class="attendance-box ${attended ? "checked" : ""}"
                data-id="${v._id}"
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
                class="row-action"
                type="button"
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
    .forEach((button) => {

      button.addEventListener("click", async () => {

        const registrationId =
          button.dataset.id;

        const registration =
          allVolunteers.find(
            v => v._id === registrationId
          );

        if (!registration) return;

        if (getStatus(registration) === "attended") {
          return;
        }

        try {

          button.disabled = true;

          await apiRequest(
            `/applications/registrations/${registrationId}/attendance`,
            {
              method: "PATCH",
              body: JSON.stringify({
                attendance: "attended"
              })
            }
          );

          registration.status = "attended";

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

      });

    });

}

/* ==================================================
   LOAD VOLUNTEERS
================================================== */

async function loadVolunteers() {

  const response =
    await apiRequest(
      `/applications/events/${eventId}/registrations`
    );

  allVolunteers =
    Array.isArray(response)
      ? response
      : response.data || [];

  renderStats();

  renderTable();

}

/* ==================================================
   FILTERS
================================================== */

function bindFilters() {

  els.filterBtns.forEach((button) => {

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

  initLogoutModal({
    triggerSelector: "#logoutBtn",
    redirectTo: ROUTES.organizerLogin
  });

}

/* ==================================================
   INIT
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      organizer = await requireOrganizer();

      if (!organizer) {
        return;
      }

      await loadOrganizerProfile({

        avatarEl: els.organizerAvatar

      });

      if (!eventId) {

        alert("No event selected.");

        window.location.href =
          ROUTES.organizerEventListing;

        return;

      }

      bindUI();

      await loadVolunteers();

    } catch (error) {

      console.error(
        "Failed to load volunteers:",
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