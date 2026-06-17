import { loadAdminProfile } from "../../assets/js/admin/admin-auth.js";

import {
  fetchOrganizers,
  applyOverrides
} from "../../assets/js/admin/admin-verification.js";

import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";


const els = {
  searchInput: document.getElementById("searchInput"),
  orgTable: document.getElementById("orgTable"),
  pendingCount: document.getElementById("pendingCount"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  logoutBtn: document.getElementById("logoutBtn"),
  logoutModal: document.getElementById("logoutModal"),
  closeLogoutModal: document.getElementById("closeLogoutModal"),
  cancelLogout: document.getElementById("cancelLogout"),
  confirmLogout: document.getElementById("confirmLogout")
};

let organizers = [];
let currentFilter = "awaiting";

function renderTable() {
  const query = els.searchInput.value.toLowerCase();

  const filtered = organizers.filter((o) => {
    const matchesFilter =
      currentFilter === "all" ? true : o._verificationStatus === currentFilter;

    const text = `
      ${o.fullName || o.name || ""}
      ${o.email || ""}
      ${o._verificationStatus}
    `.toLowerCase();

    return matchesFilter && text.includes(query);
  });

  els.pendingCount.textContent =
    organizers.filter(o => o._verificationStatus === "awaiting").length;

  if (!filtered.length) {
    els.orgTable.innerHTML = `<tr><td colspan="5">No data</td></tr>`;
    return;
  }

  els.orgTable.innerHTML = filtered.map(o => `
    <tr>
      <td>${o.fullName || o.name}</td>
      <td>${o.email}</td>
      <td>${o.city || o.state || "—"}</td>
      <td><span class="badge ${o._verificationStatus}">
        ${o._verificationStatus}
      </span></td>
      <td>
        <button class="view" data-id="${o._id}">
          View
        </button>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll(".view").forEach(btn => {
    btn.onclick = () => {
      window.location.href = `verification-details.html?id=${btn.dataset.id}`;
    };
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

function bindUI() {
  els.searchInput.oninput = renderTable;

  els.filterButtons.forEach(btn => {
    btn.onclick = () => {
      els.filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderTable();
    };
  });

  
  els.logoutBtn?.addEventListener(
  "click",
  openLogoutModal
);

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
    nameEl: document.getElementById("adminName"),
    avatarEl: document.getElementById("adminAvatar")
  });

  const raw = await fetchOrganizers();
  organizers = applyOverrides(raw);

  renderTable();
});