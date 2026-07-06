import { apiRequest } from "../api.js";
import { ROUTES } from "../config.js";

export function initOrganizerLogout() {

  const els = {
    logoutBtn: document.getElementById("logoutBtn"),
    logoutModal: document.getElementById("logoutModal"),
    closeLogoutModal: document.getElementById("closeLogoutModal"),
    cancelLogout: document.getElementById("cancelLogout"),
    confirmLogout: document.getElementById("confirmLogout")
  };

  function openLogoutModal() {
    els.logoutModal?.classList.remove("hidden");
  }

  function closeLogoutModal() {
    els.logoutModal?.classList.add("hidden");

    if (els.confirmLogout) {
      els.confirmLogout.disabled = false;
      els.confirmLogout.textContent = "Yes, Log out";
    }
  }

  async function handleLogout() {

    try {

      els.confirmLogout.disabled = true;
      els.confirmLogout.textContent = "Logging out...";

      await apiRequest("/auth/logout", {
        method: "POST"
      });

    } catch (error) {

      console.warn("Logout failed:", error.message);

    } finally {

      localStorage.clear();
      sessionStorage.clear();

      window.location.href = ROUTES.organizerLogin;

    }

  }

  els.logoutBtn?.addEventListener("click", openLogoutModal);

  els.closeLogoutModal?.addEventListener(
    "click",
    closeLogoutModal
  );

  els.cancelLogout?.addEventListener(
    "click",
    closeLogoutModal
  );

  els.confirmLogout?.addEventListener(
    "click",
    handleLogout
  );

  els.logoutModal?.addEventListener("click", (event) => {

    if (event.target === els.logoutModal) {
      closeLogoutModal();
    }

  });

  document.addEventListener("keydown", (event) => {

    if (
      event.key === "Escape" &&
      !els.logoutModal?.classList.contains("hidden")
    ) {
      closeLogoutModal();
    }

  });

}