import { loadAdminProfile } from "../../Assets/Js/admin/admin-auth.js";
import {
  fetchOrganizationDirectory,
  filterOrganizations,
  getDisplayName,
  getLocation,
  getStatusLabel
} from "../../Assets/Js/admin/admin-organizations.js";
import { ROUTES } from "../../Assets/Js/config.js";
import { logout } from "../../Assets/Js/logout.js";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  directoryTable: document.getElementById("directoryTable"),
  directoryTableWrap: document.getElementById("directoryTableWrap"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn")
};

let organizersCache = [];
let currentFilter = "all";

function renderDirectory() {
  const filtered = filterOrganizations(
    organizersCache,
    currentFilter,
    els.searchInput.value
  );

  if (!filtered.length) {
    els.directoryTableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.directoryTableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.directoryTable.innerHTML = filtered.map((organizer) => `
    <tr>
      <td>${getDisplayName(organizer)}</td>
      <td>${organizer.email || "—"}</td>
      <td>${getLocation(organizer)}</td>
      <td>
        <span class="status-badge ${organizer._status}">
          ${getStatusLabel(organizer._status)}
        </span>
      </td>
      <td>
        <a class="action-link" href="organization-details.html?id=${encodeURIComponent(organizer._id || organizer.id)}">
          View Details
        </a>
      </td>
    </tr>
  `).join("");
}

function bindFilters() {
  els.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      els.filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.filter;
      renderDirectory();
    });
  });
}

function bindUI() {
  els.searchInput.addEventListener("input", renderDirectory);
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

  organizersCache = await fetchOrganizationDirectory();
  renderDirectory();
});