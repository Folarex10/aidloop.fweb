import { apiRequest, normalizeArray } from "../../assets/js/api.js";
import { requireRole } from "../../assets/js/organizer/organizer-auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  orgName: document.getElementById("orgName"),
  orgType: document.getElementById("orgType"),
  orgCategory: document.getElementById("orgCategory"),
  verificationText: document.getElementById("verificationText"),
  profileAvatarBox: document.getElementById("profileAvatarBox"),

  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  website: document.getElementById("website"),
  location: document.getElementById("location"),
  description: document.getElementById("description"),

  totalEvents: document.getElementById("totalEvents"),
  totalVolunteers: document.getElementById("totalVolunteers"),
  certificatesIssued: document.getElementById("certificatesIssued"),

  editProfileBtn: document.getElementById("editProfileBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  feedback: document.getElementById("profileMessage")
};

let currentOrganizer = null;
let profileEditMode = false;

/* ------------------ HELPERS ------------------ */

function setFeedback(message, type = "") {
  if (!els.feedback) return;

  els.feedback.textContent = message;
  els.feedback.className = "profile-message";
  if (type) els.feedback.classList.add(type);
}

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Organization";
}

function getInitials(name) {
  return String(name || "AL")
    .split(" ")
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase();
}

function getVerificationLabel(user) {
  const status = String(user.status || "").toLowerCase();
  const approval = String(user.approvalStatus || "").toLowerCase();

  if (
    ["verified", "approved"].includes(status) ||
    ["verified", "approved"].includes(approval) ||
    user.isVerified
  ) {
    return "Verified Org";
  }

  return "Pending Verification";
}

function getLocationText(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return [
      user.location.venue,
      user.location.city || user.location.state
    ]
      .filter(Boolean)
      .join(", ");
  }

  return user.city || user.state || "—";
}

/* ------------------ UI CONTROL ------------------ */

function setInputsReadonly(readonly) {
  if (els.phoneNumber) els.phoneNumber.readOnly = readonly;
  if (els.website) els.website.readOnly = readonly;
  if (els.location) els.location.readOnly = readonly;
  if (els.description) els.description.readOnly = readonly;
}

function toggleEditMode(force = null) {
  profileEditMode = force !== null ? force : !profileEditMode;

  setInputsReadonly(!profileEditMode);

  if (els.editProfileBtn) {
    els.editProfileBtn.textContent = profileEditMode
      ? "Save Profile"
      : "Edit Profile";
  }
}

/* ------------------ VALIDATION ------------------ */

function validateProfile() {
  if (!els.phoneNumber?.value.trim()) {
    return "Phone number is required.";
  }
  return null;
}

/* ------------------ POPULATE ------------------ */

function fillProfile(user) {
  currentOrganizer = user;

  const name = getDisplayName(user);

  if (els.orgName) els.orgName.textContent = name;
  if (els.orgType) els.orgType.textContent = user.organizationType || "Non-profit";
  if (els.orgCategory) els.orgCategory.textContent = user.category || "Volunteer Management";
  if (els.verificationText) els.verificationText.textContent = getVerificationLabel(user);
  if (els.profileAvatarBox) els.profileAvatarBox.textContent = getInitials(name);

  if (els.email) els.email.value = user.email || "";
  if (els.phoneNumber) els.phoneNumber.value = user.phoneNumber || user.phone || "";
  if (els.website) {
    els.website.value =
      user.website || user.socialLink || user.socialLinks?.[0] || "";
  }
  if (els.location) els.location.value = getLocationText(user);
  if (els.description) {
    els.description.value = user.description || user.bio || "";
  }
}

/* ------------------ DATA ------------------ */

async function loadProfile() {
  try {
    let profile;

    try {
      profile = await apiRequest("/users/me");
    } catch {
      profile = await apiRequest("/user/me");
    }

    fillProfile(profile);
    toggleEditMode(false);

  } catch (error) {
    setFeedback(error.message || "Failed to load profile.", "error");
  }
}

async function loadStats() {
  if (!currentOrganizer) return;

  try {
    const payload = await apiRequest("/events");
    const events = normalizeArray(payload, ["events"]);

    const organizerId = String(currentOrganizer._id || currentOrganizer.id || "");

    const ownEvents = events.filter((event) => {
      if (event.organizer && typeof event.organizer === "object") {
        return (
          String(event.organizer._id || event.organizer.id) === organizerId
        );
      }
      return String(event.organizerId) === organizerId;
    });

    const totalEvents = ownEvents.length;

    const totalVolunteers = ownEvents.reduce((sum, event) => {
      return sum + (
        event.filledSlots ??
        event.registrationsCount ??
        event.registeredCount ??
        0
      );
    }, 0);

    if (els.totalEvents) els.totalEvents.textContent = totalEvents;
    if (els.totalVolunteers) els.totalVolunteers.textContent = totalVolunteers;
    if (els.certificatesIssued) els.certificatesIssued.textContent = "0";

  } catch {
    if (els.totalEvents) els.totalEvents.textContent = "0";
    if (els.totalVolunteers) els.totalVolunteers.textContent = "0";
    if (els.certificatesIssued) els.certificatesIssued.textContent = "0";
  }
}

async function saveProfile() {
  const error = validateProfile();
  if (error) {
    setFeedback(error, "error");
    return;
  }

  try {
    if (els.editProfileBtn) {
      els.editProfileBtn.disabled = true;
      els.editProfileBtn.textContent = "Saving...";
    }

    let updated;

    try {
      updated = await apiRequest("/user/me", {
        method: "PUT",
        body: JSON.stringify({
          phoneNumber: els.phoneNumber.value.trim(),
          website: els.website.value.trim(),
          location: els.location.value.trim(),
          description: els.description.value.trim()
        })
      });
    } catch {
      updated = await apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify({
          phoneNumber: els.phoneNumber.value.trim(),
          website: els.website.value.trim(),
          location: els.location.value.trim(),
          description: els.description.value.trim()
        })
      });
    }

    fillProfile({
      ...currentOrganizer,
      ...updated
    });

    toggleEditMode(false);
    setFeedback("Profile updated successfully.", "success");

  } catch (error) {
    setFeedback(error.message || "Failed to update profile.", "error");
  } finally {
    if (els.editProfileBtn) {
      els.editProfileBtn.disabled = false;
      els.editProfileBtn.textContent = "Edit Profile";
    }
  }
}

/* ------------------ EVENTS ------------------ */

function handleEditProfile() {
  setFeedback("");

  if (!profileEditMode) {
    toggleEditMode(true);
    return;
  }

  saveProfile();
}

function bindUI() {
  els.editProfileBtn?.addEventListener("click", handleEditProfile);

  els.logoutBtn?.addEventListener("click", () => {
    logout(ROUTES.organizerLogin);
  });
}

/* ------------------ INIT ------------------ */

document.addEventListener("DOMContentLoaded", async () => {
  const user = await requireRole("organizer", ROUTES.organizerLogin);
  if (!user) return;

  bindUI();
  await loadProfile();
  await loadStats();
});