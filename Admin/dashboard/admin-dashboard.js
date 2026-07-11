import { loadAdminProfile } from "../../assets/js/admin/admin-auth.js";
import { fetchDashboardData } from "../../assets/js/admin/admin-dashboard.js";
import { ROUTES } from "../../assets/js/config.js";
// import { logout } from "../../assets/js/logout.js";
import { initLogoutModal } from "../../assets/js/logout.js";

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
  // logoutModal: document.getElementById("logoutModal"),
  // closeLogoutModal: document.getElementById("closeLogoutModal"),
  // cancelLogout: document.getElementById("cancelLogout"),
  // confirmLogout: document.getElementById("confirmLogout"),
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

// function openLogoutModal() {
//   els.logoutModal?.classList.remove("hidden");
// }

// function closeLogoutModal() {
//   els.logoutModal?.classList.add("hidden");

//   if (els.confirmLogout) {
//     els.confirmLogout.disabled = false;
//     els.confirmLogout.textContent = "Yes, Log out";
//   }
// }

// async function handleLogout() {
//   if (els.confirmLogout) {
//     els.confirmLogout.disabled = true;
//     els.confirmLogout.textContent = "Logging out...";
//   }

//   await logout(ROUTES.home);
// }

function bindUI() {
  els.goVerificationQueue.onclick = () => location.href = ROUTES.adminVerificationQueue;
  els.viewOrganizations.onclick = () => location.href = ROUTES.adminOrganizations;
  els.viewEvents.onclick = () => location.href = ROUTES.adminEvents;

  // els.logoutBtn.onclick = () => logout(ROUTES.adminLogin);
//   els.logoutBtn.onclick = openLogoutModal;

// els.closeLogoutModal?.addEventListener(
//   "click",
//   closeLogoutModal
// );

// els.cancelLogout?.addEventListener(
//   "click",
//   closeLogoutModal
// );

// els.confirmLogout?.addEventListener(
//   "click",
//   handleLogout
// );

initLogoutModal({
    triggerSelector: "#logoutBtn",

    message:
        "You are about to end your current admin session.",

    redirectTo:
        ROUTES.home
});
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