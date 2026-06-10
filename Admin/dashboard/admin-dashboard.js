import { loadAdminProfile } from "../../assets/js/admin/admin-auth.js";
import { fetchDashboardData } from "../../assets/js/admin/admin-dashboard.js";
import { ROUTES } from "../../assets/js/config.js";
import { logout } from "../../assets/js/logout.js";

const els = {
  adminName: document.getElementById("adminName"),
  adminRole: document.getElementById("adminRole"),
  adminAvatar: document.getElementById("adminAvatar"),
  organizationCount: document.getElementById("organizationCount"),
  pendingCount: document.getElementById("pendingCount"),
  eventsCount: document.getElementById("eventsCount"),
  activeUsersCount: document.getElementById("activeUsersCount"),
  activityTable: document.getElementById("activityTable"),
  logoutBtn: document.getElementById("logoutBtn"),
  goVerificationQueue: document.getElementById("goVerificationQueue"),
  viewOrganizations: document.getElementById("viewOrganizations"),
  viewEvents: document.getElementById("viewEvents")
};

function renderStats(data) {
  els.organizationCount.textContent = data.organizationCount;
  els.pendingCount.textContent = data.pendingCount;
  els.eventsCount.textContent = data.eventsCount;
  els.activeUsersCount.textContent = data.activeUsersCount;
}

function renderActivity(rows) {
  els.activityTable.innerHTML = rows.map(r => `
    <tr>
      <td>${r.activity}</td>
      <td>${r.entity}</td>
      <td>${r.formattedDate}</td>
      <td>${r.status}</td>
    </tr>
  `).join("");
}

function bindUI() {
  els.goVerificationQueue.onclick = () => location.href = ROUTES.verification;
  els.viewOrganizations.onclick = () => location.href = ROUTES.organizations;
  els.viewEvents.onclick = () => location.href = ROUTES.events;
  els.logoutBtn.onclick = () => logout(ROUTES.landing);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindUI();

  await loadAdminProfile({
    nameEl: els.adminName,
    roleEl: els.adminRole,
    avatarEl: els.adminAvatar
  });

  const data = await fetchDashboardData();
  renderStats(data);
  renderActivity(data.activity);
});