import { apiRequest } from "../api.js";

export async function loadAdminProfile({ nameEl, roleEl, avatarEl }) {
  let profile;

  try {
    profile = await apiRequest("/users/me");
  } catch {
    profile = await apiRequest("/user/me");
  }

  if (nameEl) {
    nameEl.textContent = profile.fullName || profile.name || "Admin";
  }

  if (roleEl) {
    roleEl.textContent = profile.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : "Admin";
  }

  if (avatarEl && profile.profileImage) {
    avatarEl.src = profile.profileImage;
  }

  return profile;
}