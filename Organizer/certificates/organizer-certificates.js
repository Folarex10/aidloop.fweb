import { apiRequest, normalizeArray } from "../../assets/js/api.js";

import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";

import {
  initLogoutModal
} from "../../assets/js/logout.js";

import { ROUTES } from "../../assets/js/config.js";

import {
  formatDate
} from "../../assets/js/utils.js";

/* ==================================================
   ELEMENTS
================================================== */

const els = {

  totalCertificates:
    document.getElementById("totalCertificates"),

  issuedCertificates:
    document.getElementById("issuedCertificates"),

  pendingCertificates:
    document.getElementById("pendingCertificates"),

  certificatesTable:
    document.getElementById("certificatesTable"),

  tableCountText:
    document.getElementById("tableCountText"),

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

let organizer = null;

let allCertificates = [];

/* ==================================================
   HELPERS
================================================== */

function rowKey(userId, eventId) {

  return `${String(userId)}::${String(eventId)}`;

}

function avatar(user) {

  return (
    user?.profileImage ||
    "https://i.pravatar.cc/100?img=12"
  );

}
/* ==================================================
   NORMALIZE CERTIFICATES
================================================== */

function normalizeIssued(records) {

  return records.map((item) => ({

    status: "issued",

    certificateId:
      item._id ||
      item.id ||
      item.certificateId ||
      "",

    userId:
      item.user?._id ||
      item.user?.id ||
      item.volunteer?._id ||
      item.volunteer?.id ||
      item.userId ||
      "",

    eventId:
      item.event?._id ||
      item.event?.id ||
      item.eventId ||
      "",

    userName:
      item.user?.fullName ||
      item.user?.name ||
      item.volunteer?.fullName ||
      item.volunteer?.name ||
      item.volunteerName ||
      "Unknown Volunteer",

    userAvatar:
      avatar(item.user || item.volunteer),

    eventName:
      item.event?.name ||
      item.eventName ||
      "Untitled Event",

    date:
      item.issuedAt ||
      item.createdAt ||
      item.event?.date ||
      ""

  }));

}

/* ==================================================
   RENDER
================================================== */

function renderCertificates(rows) {

  allCertificates = rows;

  const issued =
    rows.filter(
      row => row.status === "issued"
    ).length;

  const pending =
    rows.filter(
      row => row.status === "pending"
    ).length;

  els.totalCertificates.textContent =
    rows.length;

  els.issuedCertificates.textContent =
    issued;

  els.pendingCertificates.textContent =
    pending;

  els.tableCountText.textContent =
    `Showing ${rows.length} of ${rows.length} certificates`;

  if (!rows.length) {

    els.certificatesTable.innerHTML = `
      <tr>
        <td colspan="5">
          No certificate records found.
        </td>
      </tr>
    `;

    return;

  }

  els.certificatesTable.innerHTML =
    rows.map(row => `

      <tr>

        <td>

          <div class="person-cell">

            <img
              class="avatar"
              src="${row.userAvatar}"
              alt="${row.userName}"
            />

            <span>${row.userName}</span>

          </div>

        </td>

        <td>${row.eventName}</td>

        <td>
          ${formatDate(row.date, "long")}
        </td>

        <td>

          <span class="
            status-badge
            ${row.status === "issued"
              ? "status-issued"
              : "status-pending"}
          ">

            ${
              row.status === "issued"
                ? "Issued"
                : "Pending"
            }

          </span>

        </td>

        <td>

          ${
            row.status === "issued" &&
            row.certificateId

              ? `

                <a
                  href="../certificates/certificate-preview.html?id=${encodeURIComponent(row.certificateId)}"
                >
                  View
                </a>

              `

              : "—"
          }

        </td>

      </tr>

    `).join("");

}

/* ==================================================
   LOAD CERTIFICATES
================================================== */

async function loadCertificates() {

  const eventsPayload =
    await apiRequest("/events");

  const allEvents =
    normalizeArray(eventsPayload, ["events"]);

  const organizerId =
    String(
      organizer._id ||
      organizer.id ||
      ""
    );

  const ownEvents =
    allEvents.filter(event => {

      if (
        typeof event.organizer === "object" &&
        event.organizer
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

  const registrations = [];

  for (const event of ownEvents) {

    try {

      const response =
        await apiRequest(
          `/applications/events/${event._id || event.id}/registrations`
        );

      const records =
        Array.isArray(response)
          ? response
          : response.data || [];

      records.forEach(record => {

        registrations.push({

          ...record,

          _eventId:
            event._id || event.id,

          _eventName:
            event.name || "Untitled Event",

          _eventDate:
            event.date

        });

      });

    } catch (error) {

      console.warn(
        `Unable to load registrations for ${event.name}`
      );

    }

  }

  let issuedRows = [];

  try {

    const response =
      await apiRequest(
        "/certificates/my-certificates"
      );

    issuedRows =
      normalizeIssued(
        normalizeArray(
          response,
          ["certificates"]
        )
      );

  } catch {

    issuedRows = [];

  }

  const issuedKeys =
    new Set(

      issuedRows.map(row =>

        rowKey(
          row.userId,
          row.eventId
        )

      )

    );

  const pendingRows =
    registrations

      .filter(reg => {

        const volunteer =
          reg.volunteerId || {};

        return !issuedKeys.has(

          rowKey(

            volunteer._id ||
            volunteer.id,

            reg._eventId

          )

        );

      })

      .map(reg => {

        const volunteer =
          reg.volunteerId || {};

        return {

          status: "pending",

          certificateId: "",

          userId:
            volunteer._id ||
            volunteer.id,

          eventId:
            reg._eventId,

          userName:
            volunteer.fullName ||
            "Unknown Volunteer",

          userAvatar:
            avatar(volunteer),

          eventName:
            reg._eventName,

          date:
            reg._eventDate ||
            reg.createdAt

        };

      });

  renderCertificates(

    [...issuedRows, ...pendingRows]

      .sort(

        (a, b) =>

          new Date(b.date || 0) -
          new Date(a.date || 0)

      )

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

      organizer = await requireOrganizer();

      if (!organizer) {
        return;
      }

      /* ---------------- PROFILE ---------------- */

      await loadOrganizerProfile({
        avatarEl: els.organizerAvatar
      });

      /* ---------------- LOGOUT ---------------- */

      initLogoutModal({
        triggerSelector: "#logoutBtn",
        redirectTo: ROUTES.organizerLogin
      });

      /* ---------------- LOAD DATA ---------------- */

      await loadCertificates();

    } catch (error) {

      console.error(
        "Failed to initialize certificates page:",
        error
      );

      els.certificatesTable.innerHTML = `
        <tr>
          <td colspan="5">
            Failed to load certificates.
          </td>
        </tr>
      `;

    }

  }
);