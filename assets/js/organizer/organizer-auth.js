import { apiRequest } from "../api.js";
import { ROUTES } from "../config.js";

export async function loadOrganizerProfile({
  nameEl,
  roleEl,
  avatarEl
} = {}) {

  const response = await apiRequest("/user/me");

  // Backend may return { user: {...} } or just the user object
  const profile = response.user || response;

  if (nameEl) {
    nameEl.textContent =
      profile.fullName ||
      profile.name ||
      "Organizer";
  }

  if (roleEl) {
    roleEl.textContent =
      profile.role
        ? profile.role.charAt(0).toUpperCase() +
          profile.role.slice(1)
        : "Organizer";
  }

  if (avatarEl && profile.profileImage) {
    avatarEl.src = profile.profileImage;
  }

  return profile;
}

export async function requireOrganizer() {

  const response = await apiRequest("/user/me");

  // Extract the actual user object
  const profile = response.user || response;

  const role = String(profile.role || "").toLowerCase();

  if (role !== "organizer") {
    console.log("Role check failed");
    window.location.href = ROUTES.organizerLogin;
    return null;
  }

  return profile;
}