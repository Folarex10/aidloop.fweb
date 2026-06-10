// import { apiRequest, normalizeArray } from "../../assets/js/api.js";
// import { requireOrganizer } from "../../assets/js/auth.js";
// import { logout } from "../../assets/js/logout.js";
// import { ROUTES } from "../../assets/js/config.js";
// import { formatDate, getLocationText } from "../../assets/js/utils.js";

// const els = {
//   totalEvents: document.getElementById("totalEvents"),
//   upcomingEvents: document.getElementById("upcomingEvents"),
//   completedEvents: document.getElementById("completedEvents"),
//   totalVolunteers: document.getElementById("totalVolunteers"),
//   eventsTable: document.getElementById("eventsTable"),
//   emptyState: document.getElementById("emptyState"),
//   logoutBtn: document.getElementById("logoutBtn")
// };

// let organizer = null;
// let eventsCache = [];

// /* ---------------- STATUS ---------------- */

// function getEventStatus(event) {
//   const raw = String(event.status || "").toLowerCase();

//   if (raw === "draft") return "draft";
//   if (raw === "cancelled" || raw === "canceled") return "cancelled";

//   const eventDate = event.date ? new Date(event.date) : null;

//   if (raw === "published" && eventDate && eventDate < new Date()) {
//     return "completed";
//   }

//   return "published";
// }

// /* ---------------- RENDER ---------------- */

// function renderDashboard() {
//   if (!eventsCache.length) {
//     els.eventsTable.innerHTML = "";
//     if (els.emptyState) els.emptyState.style.display = "block";

//     els.totalEvents.textContent = "0";
//     els.upcomingEvents.textContent = "0";
//     els.completedEvents.textContent = "0";
//     els.totalVolunteers.textContent = "0";
//     return;
//   }

//   if (els.emptyState) els.emptyState.style.display = "none";

//   /* SORT */
//   const sortedEvents = [...eventsCache].sort(
//     (a, b) =>
//       new Date(b.createdAt || b.date || 0) -
//       new Date(a.createdAt || a.date || 0)
//   );

//   /* STATS */
//   const totalVolunteers = sortedEvents.reduce(
//     (sum, event) =>
//       sum + (event.filledSlots ?? event.registrationsCount ?? 0),
//     0
//   );

//   els.totalEvents.textContent = sortedEvents.length;
//   els.upcomingEvents.textContent =
//     sortedEvents.filter((e) => getEventStatus(e) === "published").length;

//   els.completedEvents.textContent =
//     sortedEvents.filter((e) => getEventStatus(e) === "completed").length;

//   els.totalVolunteers.textContent = totalVolunteers;

//   /* TABLE */
//   els.eventsTable.innerHTML = sortedEvents
//     .slice(0, 5)
//     .map((event) => {
//       const status = getEventStatus(event);

//       return `
//         <tr>
//           <td>${event.name || "Untitled Event"}</td>
//           <td>${getLocationText(event)}</td>
//           <td>${formatDate(event.date, "long")}</td>
//           <td>
//             ${event.filledSlots ?? event.registrationsCount ?? 0}/${
//         event.volunteerSlots ?? 0
//       }
//           </td>
//           <td>
//             <span class="status-badge status-${status}">
//               ${status}
//             </span>
//           </td>
//         </tr>
//       `;
//     })
//     .join("");
// }

// /* ---------------- LOAD ---------------- */

// async function loadDashboard() {
//   try {
//     organizer = await requireOrganizer();
//     if (!organizer) return;

//     const payload = await apiRequest("/events");
//     const allEvents = normalizeArray(payload, ["events"]);

//     const organizerId = String(organizer._id || organizer.id || "");

//     eventsCache = allEvents.filter((event) => {
//       if (typeof event.organizer === "object" && event.organizer) {
//         return (
//           String(event.organizer._id || event.organizer.id || "") ===
//           organizerId
//         );
//       }
//       return String(event.organizerId || "") === organizerId;
//     });

//     renderDashboard();

//   } catch (error) {
//     console.error("Failed to load dashboard:", error.message);

//     els.eventsTable.innerHTML = `
//       <tr><td colspan="5">Failed to load dashboard data.</td></tr>
//     `;
//   }
// }

// /* ---------------- UI ---------------- */

// function bindUI() {
//   els.logoutBtn?.addEventListener("click", () => {
//     logout(ROUTES.organizerLogin);
//   });
// }

// /* ---------------- INIT ---------------- */

// document.addEventListener("DOMContentLoaded", async () => {
//   bindUI();
//   await loadDashboard();
// });










import { apiRequest, normalizeArray } from "../../assets/js/api.js";
import { requireOrganizer } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";
import { formatDate, getLocationText } from "../../assets/js/utils.js";

const els = {
  totalEvents: document.getElementById("totalEvents"),
  upcomingEvents: document.getElementById("upcomingEvents"),
  completedEvents: document.getElementById("completedEvents"),
  totalVolunteers: document.getElementById("totalVolunteers"),
  eventsTable: document.getElementById("eventsTable"),
  emptyState: document.getElementById("emptyState"),
  logoutBtn: document.getElementById("logoutBtn")
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

    if (!organizer) return;

    const payload =
      await apiRequest("/events");

    const allEvents =
      normalizeArray(payload, ["events"]);

    const organizerId = String(
      organizer._id ||
      organizer.id ||
      ""
    );

    eventsCache = allEvents.filter((event) => {

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
        String(event.organizerId || "") ===
        organizerId
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

// /* ==================================================
//    UI
// ================================================== */

// function bindUI() {

//   if (els.logoutBtn) {

//     els.logoutBtn.addEventListener(
//       "click",
//       async () => {

//         console.log("Logout clicked");

//         await logout(
//           ROUTES.organizerLogin
//         );
//       }
//     );
//   }
// }

/* ---------------- UI ---------------- */

function bindUI() {
  els.logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    await logout(ROUTES.organizerLogin);
  });
}
/* ==================================================
   INIT
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    bindUI();

    await loadDashboard();
  }
);
