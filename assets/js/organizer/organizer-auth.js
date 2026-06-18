import { apiRequest } from "../api.js";
import { ROUTES } from "../config.js";

export async function loadOrganizerProfile({
  nameEl,
  roleEl,
  avatarEl
} = {}) {

  const profile = await apiRequest("/user/me");

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


// export async function requireOrganizer() {
//   const profile = await apiRequest("/user/me");

//   const role = String(
//     profile.role || ""
//   ).toLowerCase();

//   if (role !== "organizer") {
//     window.location.href = ROUTES.organizerLogin;
//     return null;
//   }

//   return profile;
// }


export async function requireOrganizer() {
  const profile = await apiRequest("/user/me");

  console.log("Organizer profile:", profile);

  const role = String(profile.role || "").toLowerCase();

  console.log("Detected role:", role);

  if (role !== "organizer") {
    console.log("Role check failed");
    return null;
  }

  return profile;
}