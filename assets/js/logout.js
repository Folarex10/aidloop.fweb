import { apiRequest } from "./api.js";
import { ROUTES } from "./config.js";

/* ==================================================
   LOGOUT HANDLER
================================================== */

export async function logout(redirectTo = ROUTES.home) {

  try {

    await apiRequest("/auth/logout", {
      method: "POST"
    });

  } catch (error) {

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

/* ==================================================
   LOGOUT MODAL
================================================== */

export function initLogoutModal({
  logoutBtnId = "logoutBtn",
  modalId = "logoutModal",
  closeBtnId = "closeLogoutModal",
  cancelBtnId = "cancelLogout",
  confirmBtnId = "confirmLogout",
  redirectTo = ROUTES.home
} = {}) {

  const logoutBtn = document.getElementById(logoutBtnId);
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeBtnId);
  const cancelBtn = document.getElementById(cancelBtnId);
  const confirmBtn = document.getElementById(confirmBtnId);

  if (!logoutBtn || !modal) return;

  function openModal() {
    modal.classList.remove("hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Yes, Log out";
    }
  }

  logoutBtn.addEventListener("click", openModal);

  closeBtn?.addEventListener("click", closeModal);

  cancelBtn?.addEventListener("click", closeModal);

  confirmBtn?.addEventListener("click", async () => {

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Logging out...";

    await logout(redirectTo);

  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {
      closeModal();
    }
  });

}