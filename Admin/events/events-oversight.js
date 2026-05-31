import { loadAdminProfile } from "../../assets/js/admin/admin-auth.js";
import {
  fetchEvents,
  filterEvents,
  getEventTitle,
  getContactEmail,
  formatLocation,
  getEventStatus,
  getStatusLabel
} from "../../assets/js/admin/admin-events.js";

import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

/* ---------------- ELEMENTS ---------------- */

const els = {
  eventsTable: document.getElementById("eventsTable"),
  tableWrap: document.querySelector(".table-wrapper table"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  logoutBtn: document.getElementById("logoutBtn")
};

let eventsCache = [];
let currentFilter = "all";

/* ---------------- RENDER ---------------- */

function renderEvents() {
  const query = els.searchInput.value.trim();

  const filtered = filterEvents(eventsCache, currentFilter, query);

  if (!filtered.length) {
    els.tableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.tableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.eventsTable.innerHTML = filtered.map(event => {
    const id = event._id || event.id;
    const status = getEventStatus(event);

    return `
      <tr>
        <td>${getEventTitle(event)}</td>
        <td>${getContactEmail(event)}</td>
        <td>${formatLocation(event)}</td>
        <td>
          <span class="status-badge ${status}">
            ${getStatusLabel(status)}
          </span>
        </td>
        <td>
          <a href="../events/event-details.html?id=${encodeURIComponent(id)}">
            View
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

/* ---------------- LOAD ---------------- */

async function loadEvents() {
  try {
    // 🔥 ALWAYS FETCH FRESH DATA
    eventsCache = await fetchEvents();

    renderEvents();
  } catch (err) {
    els.eventsTable.innerHTML = `
      <tr>
        <td colspan="5">Failed to load events</td>
      </tr>
    `;
  }
}

/* ---------------- FILTER ---------------- */

function bindFilters() {
  els.filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      els.filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      currentFilter = btn.dataset.filter;
      renderEvents();
    });
  });
}

/* ---------------- LIVE REFRESH (OPTIONAL BUT POWERFUL) ---------------- */

function startAutoRefresh() {
  // refresh every 10 seconds
  setInterval(loadEvents, 10000);
}

/* ---------------- INIT ---------------- */

function bindUI() {
  els.searchInput.addEventListener("input", renderEvents);
  bindFilters();

  els.logoutBtn?.addEventListener("click", () => {
    logout(ROUTES.landing);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bindUI();

  await loadAdminProfile({
    nameEl: els.adminName,
    roleEl: els.adminRole,
    avatarEl: els.adminAvatar
  });

  await loadEvents();

  // 🔥 optional real-time feel
  startAutoRefresh();
});