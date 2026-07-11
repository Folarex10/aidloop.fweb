import { apiRequest } from "../../assets/js/api.js";
import {
  loadAdminProfile as loadAdminHeader
} from "../../assets/js/admin/admin-auth.js";
// import { logout } from "../../assets/js/logout.js";
import { initLogoutModal } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  adminAvatar: document.getElementById("adminAvatar"),
  adminNameMini: document.getElementById("adminNameMini"),
  adminRoleMini: document.getElementById("adminRoleMini"),
  fullName: document.getElementById("fullName"),
  emailAddress: document.getElementById("emailAddress"),
  role: document.getElementById("role"),
  phoneNumber: document.getElementById("phoneNumber"),
  editProfileBtn: document.getElementById("editProfileBtn"),
  profileFeedback: document.getElementById("profileFeedback"),
  currentPassword: document.getElementById("currentPassword"),
  newPassword: document.getElementById("newPassword"),
  confirmPassword: document.getElementById("confirmPassword"),
  passwordForm: document.getElementById("passwordForm"),
  passwordFeedback: document.getElementById("passwordFeedback"),
  logoutBtn: document.getElementById("logoutBtn")
  // logoutModal: document.getElementById("logoutModal"),
  // closeLogoutModal: document.getElementById("closeLogoutModal"),
  // cancelLogout: document.getElementById("cancelLogout"),
  // confirmLogout: document.getElementById("confirmLogout")
};

let profileEditMode = false;
let currentAdmin = null;

/* ---------------- HELPERS ---------------- */

function setFeedback(el, message, type = "") {
  el.textContent = message;
  el.className = "feedback";
  if (type) el.classList.add(type);
}

function fillProfile(profile) {
  currentAdmin = profile;

  const fullName = profile.fullName || profile.name || "Admin";
  const role = profile.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Admin";

  els.adminNameMini.textContent = fullName;
  els.adminRoleMini.textContent = role;

  els.fullName.value = fullName;
  els.emailAddress.value = profile.email || "";
  els.role.value = role;
  els.phoneNumber.value = profile.phoneNumber || profile.phone || "";

  if (profile.profileImage) {
    els.adminAvatar.src = profile.profileImage;
  }
}

function toggleEditMode(force = null) {
  profileEditMode = force !== null ? force : !profileEditMode;

  els.phoneNumber.readOnly = !profileEditMode;

  els.editProfileBtn.textContent = profileEditMode
    ? "Save Profile"
    : "Edit Profile";
}

/* ---------------- PROFILE ---------------- */

async function loadProfile() {
  try {
    const profile = await apiRequest("/user/me");

    fillProfile(profile);
    toggleEditMode(false);

  } catch (err) {
    setFeedback(els.profileFeedback, err.message, "error");
  }
}

async function saveProfile() {
  try {
    els.editProfileBtn.disabled = true;

    const updated = await apiRequest("/user/me", {
      method: "PUT",
      body: JSON.stringify({
        phoneNumber: els.phoneNumber.value.trim()
      })
    });

    fillProfile({ ...currentAdmin, ...updated });

    toggleEditMode(false);
    setFeedback(els.profileFeedback, "Profile updated successfully", "success");

  } catch (err) {
    setFeedback(els.profileFeedback, err.message, "error");
  } finally {
    els.editProfileBtn.disabled = false;
  }
}

function handleEditProfile() {
  setFeedback(els.profileFeedback, "");

  if (!profileEditMode) {
    toggleEditMode(true);
  } else {
    saveProfile();
  }
}

/* ---------------- PASSWORD ---------------- */

async function updatePassword(e) {
  e.preventDefault();

  const current = els.currentPassword.value.trim();
  const next = els.newPassword.value.trim();
  const confirm = els.confirmPassword.value.trim();

  if (!current || !next || !confirm) {
    setFeedback(els.passwordFeedback, "All fields required", "error");
    return;
  }

  if (next !== confirm) {
    setFeedback(els.passwordFeedback, "Passwords do not match", "error");
    return;
  }

  try {
    await apiRequest("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({
        currentPassword: current,
        newPassword: next
      })
    });

    els.passwordForm.reset();
    setFeedback(els.passwordFeedback, "Password updated successfully", "success");

  } catch (err) {
    setFeedback(els.passwordFeedback, err.message, "error");
  }
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

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {

  await loadAdminHeader({
    nameEl: els.adminNameMini,
    roleEl: els.adminRoleMini,
    avatarEl: els.adminAvatar
  });

  els.editProfileBtn.addEventListener("click", handleEditProfile);
  els.passwordForm.addEventListener("submit", updatePassword);

  // els.logoutBtn.onclick = openLogoutModal;

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
        ROUTES.adminLogin
});

  await loadProfile();
});