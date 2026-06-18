import { apiRequest } from "../../assets/js/api.js";
import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";
import { logout } from "../../assets/js/logout.js";
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

     console.log("STEP 1: Dashboard loading");

    organizer = await requireOrganizer();

    console.log(JSON.stringify(organizer, null, 2));

    console.log("STEP 2: Organizer =", organizer);

    await loadOrganizerProfile({
  nameEl: document.getElementById("organizerName"),
  roleEl: document.getElementById("organizerRole"),
  avatarEl: document.getElementById("organizerAvatar")
});



   
    if (!organizer) {
      console.log("STEP 3: Organizer not found");
      return;
    }

    const payload =
      await apiRequest("/events");

      console.log("STEP 4: Raw payload =", payload);

    const allEvents =
      normalizeArray(payload, ["events"]);

      console.log("STEP 5: All events =", allEvents);

      console.log(
      "FIRST EVENT JSON =",
      JSON.stringify(allEvents[0], null, 2)
      );

      console.log(
      "EVENT OWNERSHIP FIELDS JSON =",
      JSON.stringify(
      allEvents.map(event => ({
      name: event.name,
      organizer: event.organizer,
      organizerId: event.organizerId,
      createdBy: event.createdBy,
      userId: event.userId,
      owner: event.owner
    })),
    null,
    2
  )
);

    const organizerId = String(
      organizer._id ||
      organizer.id ||
      ""
    );

    console.log("STEP 6: Organizer ID =", organizerId);


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


    console.log("STEP 7: Filtered events =", eventsCache);

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

function openLogoutModal() {
  els.logoutModal?.classList.remove("hidden");
}

function closeLogoutModal() {
  els.logoutModal?.classList.add("hidden");

  if (els.confirmLogout) {
    els.confirmLogout.disabled = false;
    els.confirmLogout.textContent = "Yes, Log out";
  }
}

async function handleLogout() {
  try {
    els.confirmLogout.disabled = true;
    els.confirmLogout.textContent = "Logging out...";

    await apiRequest("/auth/logout", {
      method: "POST"
    });

  } catch (error) {
    console.warn("Logout failed:", error.message);

  } finally {
    localStorage.clear();
    sessionStorage.clear();

    window.location.href = ROUTES.organizerLogin;
  }
}

//    UI
// ================================================== */

function bindUI() {
  els.logoutBtn?.addEventListener("click", openLogoutModal);

  els.closeLogoutModal?.addEventListener(
    "click",
    closeLogoutModal
  );

  els.cancelLogout?.addEventListener(
    "click",
    closeLogoutModal
  );

  els.confirmLogout?.addEventListener(
    "click",
    handleLogout
  );

  els.logoutModal?.addEventListener("click", (event) => {
    if (event.target === els.logoutModal) {
      closeLogoutModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !els.logoutModal?.classList.contains("hidden")
    ) {
      closeLogoutModal();
    }
  });
}

/* ---------------- UI ---------------- */

// function bindUI() {
//   els.logoutBtn?.addEventListener("click", async (e) => {
//     e.preventDefault();
//     await logout(ROUTES.organizerLogin);
//   });
// }
/* ==================================================
   INIT
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    bindUI();

    console.log("Dashboard loading...");

    await loadDashboard();

    organizer = await requireOrganizer();

    console.log("Organizer returned:", organizer);
  }
);
