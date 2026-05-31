import { apiRequest } from "../../assets/js/api.js";
import { normalizeArray } from "../../assets/js/utils.js";
import { loadAdminProfile } from "../../assets/js/admin/admin-auth.js";
import {
  getEventTitle,
  getEventId,
  getEventStatus,
  formatDate
} from "../../assets/js/admin/admin-events.js";

import { getFlaggedEvents } from "../../assets/js/admin/admin-flags.js";
import { autoFlagIfRepeatedCancellation } from "../../assets/js/admin/admin-flags.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  flagsTable: document.getElementById("flagsTable"),
  flagsTableWrap: document.querySelector(".table-wrapper table"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn")
};

let flagsCache = [];
let currentFilter = "all";

/* ---------------- FETCH EVENTS ---------------- */

async function fetchEvents() {
  const payload = await apiRequest("/events");
  return normalizeArray(payload, ["events"]);
}

/* ---------------- BUILD FLAGS ---------------- */

function getSeverity(count) {
  if (count <= 1) return "low";
  if (count <= 3) return "medium";
  return "high";
}

function buildFlags(events, flaggedMap) {
  return events
    .filter((event) => flaggedMap[getEventId(event)])
    .map((event) => {
      const flagData = flaggedMap[getEventId(event)];

      return {
        id: getEventId(event),
        name: getEventTitle(event),
        status: getEventStatus(event),
        reason: flagData.reason,
        date: flagData.flaggedAt,
        severity: getSeverity(1),
        severityLabel: getSeverity(1).toUpperCase()
      };
    })
    .sort((a, b) => b.date - a.date);
}

/* ---------------- RENDER ---------------- */

function renderFlags() {
  const query = els.searchInput.value.trim().toLowerCase();

  let filtered = [...flagsCache];

  if (currentFilter !== "all") {
    filtered = filtered.filter((f) => f.status === currentFilter);
  }

  if (query) {
    filtered = filtered.filter((f) => {
      const text = `
        ${f.name}
        ${f.reason}
        ${f.status}
      `.toLowerCase();

      return text.includes(query);
    });
  }

  if (!filtered.length) {
    els.flagsTableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.flagsTableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.flagsTable.innerHTML = filtered.map((f) => `
    <tr>
      <td>${f.name}</td>
      <td>1</td>
      <td>
        <span class="severity-badge ${f.severity}">
          ${f.severityLabel}
        </span>
      </td>
      <td>${formatDate(f.date)}</td>
      <td>${f.reason}</td>
      <td>
        <a href="../events/event-details.html?id=${encodeURIComponent(f.id)}">
          View Event
        </a>
      </td>
    </tr>
  `).join("");
}

/* ---------------- FILTER ---------------- */

function bindFilters() {
  els.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      els.filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderFlags();
    });
  });
}

/* ---------------- LOAD ---------------- */

// async function loadFlags() {
//   try {
//     const [events, flaggedMap] = await Promise.all([
//       fetchEvents(),
//       getFlaggedEvents()
//     ]);

//     flagsCache = buildFlags(events, flaggedMap);
//     renderFlags();
//   } catch (err) {
//     els.flagsTable.innerHTML = `
//       <tr>
//         <td colspan="6">Failed to load flags</td>
//       </tr>
//     `;
//   }
// }

async function loadFlags() {
  try {
    const events = await fetchEvents();

    // 🔥 NEW: auto detect repeated cancellations
    autoFlagIfRepeatedCancellation(events);

    const flaggedMap = getFlaggedEvents();

    flagsCache = buildFlags(events, flaggedMap);

    renderFlags();
  } catch (err) {
    els.flagsTable.innerHTML = `
      <tr>
        <td colspan="6">Failed to load flags</td>
      </tr>
    `;
  }
}

/* ---------------- INIT ---------------- */

function bindUI() {
  els.searchInput.addEventListener("input", renderFlags);
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

  await loadFlags();
});