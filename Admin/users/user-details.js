import { apiRequest } from "../../assets/js/api.js";
import { requireRole } from "../../assets/js/auth.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  userTitle: document.getElementById("userTitle"),
  roleBadge: document.getElementById("roleBadge"),
  userName: document.getElementById("userName"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  dateJoined: document.getElementById("dateJoined"),
  statusBadge: document.getElementById("statusBadge"),
  description: document.getElementById("description"),
  feedback: document.getElementById("feedback"),
  deactivateBtn: document.getElementById("deactivateBtn"),
  reactivateBtn: document.getElementById("reactivateBtn")
};

const userId = new URLSearchParams(window.location.search).get("id");
let currentUser = null;

/* ---------------- HELPERS ---------------- */

function normalizeUsers(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "User";
}

function getLocation(user) {
  if (typeof user.location === "string") return user.location;

  if (user.location && typeof user.location === "object") {
    return (
      [user.location.venue, user.location.city || user.location.state]
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  return user.city || user.state || "—";
}

function getRole(user) {
  return String(user.role || "user").toLowerCase();
}

function getStatus(user) {
  return user.isActive === false ? "deactivated" : "active";
}

/* ---------------- UI ---------------- */

function setFeedback(message, type = "") {
  els.feedback.textContent = message;
  els.feedback.className = "feedback";
  if (type) els.feedback.classList.add(type);
}

function setRoleBadge(role) {
  els.roleBadge.textContent =
    role.charAt(0).toUpperCase() + role.slice(1);
  els.roleBadge.className = "role-badge";
  els.roleBadge.classList.add(role);
}

function setStatusBadge(status) {
  els.statusBadge.textContent =
    status === "deactivated" ? "Deactivated" : "Active";
  els.statusBadge.className = "status-badge";
  els.statusBadge.classList.add(status);
}

function syncButtons(status) {
  if (status === "deactivated") {
    els.deactivateBtn.disabled = true;
    els.deactivateBtn.textContent = "Deactivated";
    els.reactivateBtn.disabled = false;
  } else {
    els.deactivateBtn.disabled = false;
    els.deactivateBtn.textContent = "Deactivate";
    els.reactivateBtn.disabled = true;
  }
}

/* ---------------- POPULATE ---------------- */

function populateUser(user) {
  currentUser = user;

  const role = getRole(user);
  const status = getStatus(user);

  els.userTitle.textContent = getDisplayName(user);
  els.userName.textContent = getDisplayName(user);
  els.email.textContent = user.email || "—";
  els.phoneNumber.textContent = user.phoneNumber || user.phone || "—";
  els.location.textContent = getLocation(user);
  els.dateJoined.textContent = formatDate(user.createdAt);
  els.description.textContent =
    user.description || user.bio || "No description available.";

  setRoleBadge(role);
  setStatusBadge(status);
  syncButtons(status);
}

/* ---------------- LOAD ---------------- */

async function loadUserDetails() {
  if (!userId) {
    setFeedback("No user ID provided", "error");
    return;
  }

  try {
    const payload = await apiRequest("/user")
      .catch(() => apiRequest("/users"));

    const users = normalizeUsers(payload);

    const user = users.find(
      (u) => String(u._id || u.id) === String(userId)
    );

    if (!user) throw new Error("User not found");

    populateUser(user);

  } catch (err) {
    setFeedback(err.message, "error");
  }
}

/* ---------------- ACTIONS ---------------- */

async function deactivateUser() {
  try {
    els.deactivateBtn.disabled = true;
    els.deactivateBtn.textContent = "Deactivating...";

    await apiRequest(`/admin/users/${userId}/deactivate`, {
      method: "PATCH"
    });

    currentUser.isActive = false;

    setStatusBadge("deactivated");
    syncButtons("deactivated");
    setFeedback("User deactivated successfully", "success");

  } catch (err) {
    syncButtons(getStatus(currentUser));
    setFeedback(err.message, "error");
  }
}

async function reactivateUser() {
  try {
    els.reactivateBtn.disabled = true;
    els.reactivateBtn.textContent = "Reactivating...";

    await apiRequest(`/admin/users/${userId}/reactivate`, {
      method: "PATCH"
    });

    currentUser.isActive = true;

    setStatusBadge("active");
    syncButtons("active");
    setFeedback("User reactivated successfully", "success");

  } catch (err) {
    syncButtons(getStatus(currentUser));
    setFeedback(err.message, "error");
  }
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("admin", ROUTES.adminLogin);

  els.deactivateBtn.addEventListener("click", deactivateUser);
  els.reactivateBtn.addEventListener("click", reactivateUser);

  await loadUserDetails();
});