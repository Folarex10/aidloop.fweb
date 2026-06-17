import { apiRequest } from "../../assets/js/api.js";
import { normalizeArray } from "../../assets/js/utils.js";

import { loadAdminProfile } from "../../assets/js/admin/admin-auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

/* ---------------- ELEMENTS ---------------- */

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  certificatesTable: document.getElementById("certificatesTable"),
  certificatesTableWrap: document.querySelector(".table-wrapper table"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let certificateRowsCache = [];
let currentFilter = "all";

/* ---------------- HELPERS ---------------- */

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getVolunteerName(item) {
  return (
    item.user?.fullName ||
    item.volunteer?.fullName ||
    item.user?.name ||
    "Volunteer"
  );
}

function getEventName(item) {
  return item.event?.name || "Event";
}

function getOrganizerName(item) {
  return (
    item.event?.organizer?.name ||
    item.organizer?.name ||
    "Organizer"
  );
}

function getCertificateId(item) {
  return item._id || item.id;
}

/* ---------------- RENDER ---------------- */

function renderCertificates() {
  const query = els.searchInput.value.trim().toLowerCase();

  let filtered = [...certificateRowsCache];

  // 🔥 FILTER (only "issued" exists now)
  if (currentFilter === "issued") {
    filtered = filtered;
  }

  // 🔍 SEARCH
  if (query) {
    filtered = filtered.filter((item) => {
      const text = `
        ${getVolunteerName(item)}
        ${getEventName(item)}
        ${getOrganizerName(item)}
      `.toLowerCase();

      return text.includes(query);
    });
  }

  if (!filtered.length) {
    els.certificatesTableWrap.style.display = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.certificatesTableWrap.style.display = "table";
  els.emptyState.style.display = "none";

  els.certificatesTable.innerHTML = filtered.map((item) => {
    const id = getCertificateId(item);

    return `
      <tr>
        <td>${getVolunteerName(item)}</td>
        <td>${getEventName(item)}</td>
        <td>${getOrganizerName(item)}</td>
        <td>${formatDate(item.issuedAt || item.createdAt)}</td>
        <td>
          <a class="action-link" href="certificate-preview.html?id=${encodeURIComponent(id)}">
            View
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

/* ---------------- LOAD ---------------- */

async function loadCertificates() {
  try {
    // 🔥 ADMIN should fetch ALL certificates
    const payload = await apiRequest("/certificates");

    certificateRowsCache = normalizeArray(payload, ["certificates"]);

    // 🔥 newest first
    certificateRowsCache.sort(
      (a, b) =>
        new Date(b.issuedAt || b.createdAt || 0) -
        new Date(a.issuedAt || a.createdAt || 0)
    );

    renderCertificates();
  } catch (err) {
    console.error("Failed to load certificates:", err.message);
    certificateRowsCache = [];
    renderCertificates();
  }
}

/* ---------------- FILTER ---------------- */

function bindFilters() {
  els.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      els.filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      currentFilter = btn.dataset.filter;
      renderCertificates();
    });
  });
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
  if (els.confirmLogout) {
    els.confirmLogout.disabled = true;
    els.confirmLogout.textContent = "Logging out...";
  }

  await logout(ROUTES.home);
}

/* ---------------- INIT ---------------- */

function bindUI() {
  els.searchInput.addEventListener("input", renderCertificates);

  bindFilters();

  // els.logoutBtn?.addEventListener("click", () => {
  //   logout(ROUTES.home);
  // });

  els.logoutBtn.onclick = openLogoutModal;

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
}

document.addEventListener("DOMContentLoaded", async () => {
  bindUI();

  await loadAdminProfile({
    nameEl: els.adminName,
    roleEl: els.adminRole,
    avatarEl: els.adminAvatar
  });

  await loadCertificates();
});