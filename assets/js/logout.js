import { apiRequest } from "./api.js";
import { ROUTES } from "./config.js";

/* ==================================================
   LOGOUT HANDLER
================================================== */

export async function logout(redirectTo = ROUTES.home) {

  try {

    /* Backend logout */
    await apiRequest("/auth/logout", {
      method: "POST"
    });

  } catch (error) {

    /* Do not block logout if backend fails */
    console.warn("Logout request failed:", error?.message);

  } finally {

    /* ---------------- LOCAL STORAGE ---------------- */

    localStorage.removeItem("aidloop_admin_email");
    localStorage.removeItem("aidloop_organizer_email");
    localStorage.removeItem("aidloop_volunteer_email");

    localStorage.removeItem("aidloop_user");
    localStorage.removeItem("aidloop_token");

    /* ---------------- SESSION STORAGE ---------------- */

    sessionStorage.removeItem(
      "aidloop_pending_verification_email"
    );

    sessionStorage.removeItem("aidloop_user");

    /* ---------------- REDIRECT ---------------- */

    window.location.href = redirectTo;
  }
}
