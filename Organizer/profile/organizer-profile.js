import { apiRequest } from "../../assets/js/api.js";
import { normalizeArray } from "../../assets/js/utils.js";
import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";

import { initLogoutModal } from "../../assets/js/logout.js";
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

  eventsMonthText: document.getElementById("eventsMonthText"),
  volunteersMonthText: document.getElementById("volunteersMonthText"),
  certificatesMonthText: document.getElementById("certificatesMonthText"),

  editProfileBtn: document.getElementById("editProfileBtn"),

  logoutBtn: document.getElementById("logoutBtn"),

  organizerAvatar:
    document.getElementById("organizerAvatar"),

  logoutModal:
    document.getElementById("logoutModal"),

  closeLogoutModal:
    document.getElementById("closeLogoutModal"),

  cancelLogout:
    document.getElementById("cancelLogout"),

  confirmLogout:
    document.getElementById("confirmLogout"),

  feedback:
    document.getElementById("profileMessage")
};

let organizer = null;
let currentOrganizer = null;
let organizerEvents = [];
let profileEditMode = false;

/* ==================================================
   HELPERS
================================================== */

function setFeedback(message = "", type = "") {

  if (!els.feedback) return;

  els.feedback.textContent = message;
  els.feedback.className = "profile-message";

  if (type) {
    els.feedback.classList.add(type);
  }

}

function getDisplayName(user) {

  return (
    user.organizationName ||
    user.fullName ||
    user.name ||
    "Organization"
  );

}

function getInitials(name) {

  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join("")
    .toUpperCase();

}

function getVerificationText(user) {

  const status =
    String(user.status || "").toLowerCase();

  const approval =
    String(user.approvalStatus || "").toLowerCase();

  if (
    user.isVerified ||
    ["verified", "approved"].includes(status) ||
    ["verified", "approved"].includes(approval)
  ) {

    return "Verified Organization";

  }

  return "Pending Verification";

}

function getLocationText(user) {

  if (
    typeof user.location === "string" &&
    user.location.trim()
  ) {

    return user.location;

  }

  if (
    user.location &&
    typeof user.location === "object"
  ) {

    return [
      user.location.venue,
      user.location.city,
      user.location.state
    ]
      .filter(Boolean)
      .join(", ");

  }

  return (
    user.city ||
    user.state ||
    ""
  );

}

/* ==================================================
   PROFILE EDIT MODE
================================================== */

function setReadonly(readonly) {

  els.phoneNumber.readOnly = readonly;
  els.website.readOnly = readonly;
  els.location.readOnly = readonly;
  els.description.readOnly = readonly;

}

function toggleEditMode(force = null) {

  profileEditMode =
    force !== null
      ? force
      : !profileEditMode;

  setReadonly(!profileEditMode);

  els.editProfileBtn.textContent =
    profileEditMode
      ? "Save Profile"
      : "Edit Profile";

}

/* ==================================================
   POPULATE PROFILE
================================================== */

function populateProfile(user) {

  const name = getDisplayName(user);

  els.orgName.textContent = name;

  els.orgType.textContent =
    user.organizationType ||
    "Organization";

  els.orgCategory.textContent =
    user.category ||
    "Volunteer Management";

  els.verificationText.textContent =
    getVerificationText(user);

  els.profileAvatarBox.textContent =
    getInitials(name);

  els.email.value =
    user.email || "";

  els.phoneNumber.value =
    user.phoneNumber ||
    user.phone ||
    "";

  els.website.value =
    user.website ||
    user.socialLink ||
    "";

  els.location.value =
    getLocationText(user);

  els.description.value =
    user.description ||
    user.bio ||
    "";

}

/* ==================================================
   VALIDATION
================================================== */

function validateProfile() {

  if (!els.phoneNumber.value.trim()) {
    return "Phone number is required.";
  }

  return null;

}
/* ==================================================
   LOAD PROFILE
================================================== */

async function loadProfile() {

  try {

    let profile;

    try {

      profile = await apiRequest("/users/me");

    } catch {

      profile = await apiRequest("/user/me");

    }

    currentOrganizer =
      profile.data ||
      profile.user ||
      profile;

    populateProfile(currentOrganizer);

    toggleEditMode(false);

  } catch (error) {

    console.error(error);

    setFeedback(
      error.message || "Failed to load profile.",
      "error"
    );

  }

}

/* ==================================================
   LOAD ORGANIZER EVENTS
================================================== */

async function loadOrganizerStats() {

  try {

    const response =
      await apiRequest("/events/my-events");

    organizerEvents =
      response.data ||
      response.events ||
      [];

    let volunteerCount = 0;

    organizerEvents.forEach(event => {

      volunteerCount +=
        Number(
          event.registeredCount ||
          event.registrationsCount ||
          0
        );

    });

    els.totalEvents.textContent =
      organizerEvents.length;

    els.totalVolunteers.textContent =
      volunteerCount;

    await loadCertificateCount();

  } catch (error) {

    console.error(error);

    els.totalEvents.textContent = "0";
    els.totalVolunteers.textContent = "0";
    els.certificatesIssued.textContent = "0";

  }

}

/* ==================================================
   LOAD CERTIFICATES
================================================== */

async function loadCertificateCount() {

  try {

    const response =
      await apiRequest("/certificates/organizer");

    const certificates =
      response.data ||
      response.certificates ||
      [];

    els.certificatesIssued.textContent =
      certificates.length;

  } catch {

    els.certificatesIssued.textContent = "0";

  }

}

/* ==================================================
   SAVE PROFILE
================================================== */

async function saveProfile() {

  const error = validateProfile();

  if (error) {

    setFeedback(error, "error");

    return;

  }

  try {

    els.editProfileBtn.disabled = true;

    els.editProfileBtn.textContent =
      "Saving...";

    const payload = {

      phoneNumber:
        els.phoneNumber.value.trim(),

      website:
        els.website.value.trim(),

      location:
        els.location.value.trim(),

      description:
        els.description.value.trim()

    };

    const response =
      await apiRequest(
        "/users/me",
        {

          method: "PUT",

          body: JSON.stringify(payload)

        }
      );

    currentOrganizer = {

      ...currentOrganizer,

      ...(response.data ||
         response.user ||
         response)

    };

    populateProfile(currentOrganizer);

    toggleEditMode(false);

    setFeedback(
      "Profile updated successfully.",
      "success"
    );

  } catch (error) {

    console.error(error);

    setFeedback(
      error.message ||
      "Failed to update profile.",
      "error"
    );

  } finally {

    els.editProfileBtn.disabled = false;

    els.editProfileBtn.textContent =
      profileEditMode
        ? "Save Profile"
        : "Edit Profile";

  }

}
/* ==================================================
   EDIT PROFILE
================================================== */

function handleEditProfile() {

  setFeedback("");

  if (!profileEditMode) {

    toggleEditMode(true);

    return;

  }

  saveProfile();

}

/* ==================================================
   UI
================================================== */

function bindUI() {

  els.editProfileBtn?.addEventListener(
    "click",
    handleEditProfile
  );

  initLogoutModal({

    triggerSelector: "#logoutBtn",

    redirectTo: ROUTES.organizerLogin

  });

}

/* ==================================================
   INIT
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      organizer =
        await requireOrganizer();

      if (!organizer) {

        return;

      }

      await loadOrganizerProfile({

        avatarEl:
          els.organizerAvatar

      });

      bindUI();

      await loadProfile();

      await loadOrganizerStats();

    } catch (error) {

      console.error(
        "Failed to initialize organizer profile:",
        error
      );

      setFeedback(
        error.message ||
        "Unable to load profile.",
        "error"
      );

    }

  }
);