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










// import { apiRequest } from "./api.js";

// function createLogoutModal({
//   title = "Log out?",
//   message = "You are about to end your current session.",
//   confirmText = "Yes, Log out"
// } = {}) {

//   if (document.getElementById("logoutModal")) return;

//   document.body.insertAdjacentHTML(
//     "beforeend",
//     `
//       <div class="modal-overlay hidden" id="logoutModal">

//         <div class="modal-card">

//           <button
//             class="modal-close-btn"
//             id="closeLogoutModal"
//             type="button"
//             aria-label="Close"
//           >
//             &times;
//           </button>

//           <div class="modal-icon-wrap">
//             <i class="fa-solid fa-arrow-right-from-bracket"></i>
//           </div>

//           <h3>${title}</h3>

//           <p>${message}</p>

//           <div class="modal-actions">

//             <button
//               id="cancelLogout"
//               class="modal-btn secondary"
//               type="button"
//             >
//               Cancel
//             </button>

//             <button
//               id="confirmLogout"
//               class="modal-btn danger"
//               type="button"
//             >
//               ${confirmText}
//             </button>

//           </div>

//         </div>

//       </div>
//     `
//   );

// }

// export function initLogoutModal({

//   triggerSelector = "#logoutBtn",

//   redirectTo = "/",

//   title,

//   message,

//   confirmText

// } = {}) {

//   createLogoutModal({
//     title,
//     message,
//     confirmText
//   });

//   const trigger =
//     document.querySelector(triggerSelector);

//   const modal =
//     document.getElementById("logoutModal");

//   const closeBtn =
//     document.getElementById("closeLogoutModal");

//   const cancelBtn =
//     document.getElementById("cancelLogout");

//   const confirmBtn =
//     document.getElementById("confirmLogout");

//   if (!trigger || !modal) return;

//   const open = () =>
//     modal.classList.remove("hidden");

//   const close = () =>
//     modal.classList.add("hidden");

//   trigger.addEventListener("click", open);

//   closeBtn?.addEventListener("click", close);

//   cancelBtn?.addEventListener("click", close);

//   modal.addEventListener("click", (e) => {
//     if (e.target === modal) {
//       close();
//     }
//   });

//   confirmBtn?.addEventListener("click", async () => {

//     confirmBtn.disabled = true;

//     try {

//       try {
//         await apiRequest("/auth/logout", {
//           method: "POST"
//         });
//       } catch {
//         // Ignore backend logout failure.
//       }

//       localStorage.clear();
//       sessionStorage.clear();

//       window.location.href = redirectTo;

//     } finally {

//       confirmBtn.disabled = false;

//     }

//   });

// }

// export async function logout(redirectTo = "/") {

//   try {

//     try {
//       await apiRequest("/auth/logout", {
//         method: "POST"
//       });
//     } catch {}

//     localStorage.clear();
//     sessionStorage.clear();

//     window.location.href = redirectTo;

//   } catch {

//     window.location.href = redirectTo;

//   }

// }