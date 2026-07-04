import { apiRequest, normalizeArray } from "../../assets/js/api.js";
import { requireOrganizer } from "../../assets/js/organizer/organizer-auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";
import { formatDate, getLocationText } from "../../assets/js/utils.js";

const els = {
  table: document.getElementById("eventsTable"),
  emptyState: document.getElementById("emptyState"),
  logoutBtn: document.getElementById("logoutBtn")
};

let organizer = null;
let eventsCache = [];

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

/* ---------------- RENDER ---------------- */

function renderEvents() {
  if (!eventsCache.length) {
    els.table.innerHTML = "";

    if (els.emptyState) {
      els.emptyState.style.display = "block";
    }

    return;
  }

  if (els.emptyState) {
    els.emptyState.style.display = "none";
  }

  const sorted = [...eventsCache].sort(
    (a, b) =>
      new Date(b.createdAt || b.date || 0) -
      new Date(a.createdAt || a.date || 0)
  );

  els.table.innerHTML = sorted
    .map((event) => {
      const status = getEventStatus(event);

      return `
        <tr>
          <td>${event.name || "Untitled Event"}</td>
          <td>${getLocationText(event)}</td>
          <td>${formatDate(event.date, "long")}</td>
          <td>
            ${event.filledSlots ?? event.registrationsCount ?? 0}
            /
            ${event.volunteerSlots ?? 0}
          </td>
          <td>
            <span class="status-badge status-${status}">
              ${status}
            </span>
          </td>
          <td>
            <a class="action-link" href="event-details.html?id=${encodeURIComponent(event._id || event.id)}">
              Details
            </a>
          </td>
        </tr>
      `;
    })
    .join("");
}

/* ---------------- LOAD ---------------- */

async function loadEvents() {
  try {
    organizer = await requireOrganizer();
    if (!organizer) return;

    const payload = await apiRequest("/events");
    const allEvents = normalizeArray(payload, ["events"]);

    const organizerId = String(organizer._id || organizer.id || "");

    eventsCache = allEvents.filter((event) => {
      if (typeof event.organizer === "object" && event.organizer) {
        return (
          String(event.organizer._id || event.organizer.id || "") ===
          organizerId
        );
      }
      return String(event.organizerId || "") === organizerId;
    });

    renderEvents();

  } catch (error) {
    console.error("Failed to load events:", error.message);

    els.table.innerHTML = `
      <tr>
        <td colspan="6">Failed to load events.</td>
      </tr>
    `;
  }
}

/* ---------------- UI ---------------- */

function bindUI() {
  els.logoutBtn?.addEventListener("click", () => {
    logout(ROUTES.organizerLogin);
  });
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  bindUI();
  await loadEvents();
});