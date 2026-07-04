import { apiRequest } from "../../assets/js/api.js";
import { requireRole } from "../../assets/js/organizer/organizer-auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

const eventId = new URLSearchParams(window.location.search).get("id");

const els = {
  cancelBtn: document.getElementById("cancelEventBtn"),
  goBackBtn: document.getElementById("goBackBtn"),
  reasonText: document.getElementById("reasonText"),
  logoutBtn: document.getElementById("logoutBtn"),
  confirmModal: document.getElementById("confirmModal"),
  confirmCancel: document.getElementById("confirmCancel"),
  closeModal: document.getElementById("closeModal"),
  cancelModal: document.getElementById("cancelModal")
};

/* ---------------- HELPERS ---------------- */

function getSelectedReasons() {
  return [...document.querySelectorAll("input[type='checkbox']:checked")]
    .map((cb) => cb.value.trim())
    .filter(Boolean);
}

function buildReason() {
  const selected = getSelectedReasons();
  const text = els.reasonText.value.trim();

  return [...selected, text].filter(Boolean).join(", ");
}

function openModal() {
  els.confirmModal.classList.remove("hidden");
}

function hideModal() {
  els.confirmModal.classList.add("hidden");
}

function validateEventId() {
  if (!eventId || eventId === "undefined" || eventId === "null") {
    alert("Invalid event ID");
    window.location.href = ROUTES.organizerEventListing;
    return false;
  }
  return true;
}

/* ---------------- CANCEL EVENT ---------------- */

async function cancelEvent() {
  if (!validateEventId()) return;

  const reason = buildReason();

  if (!reason) {
    alert("Please provide a reason for cancellation");
    return;
  }

  try {
    els.confirmCancel.disabled = true;
    els.confirmCancel.textContent = "Cancelling...";

    await apiRequest(`/events/${eventId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({
        cancelReason: reason   // ✅ FIXED KEY
      })
    });

    alert("Event cancelled successfully");

    window.location.href = ROUTES.organizerEventListing;

  } catch (err) {
    alert(err.message || "Failed to cancel event");

    els.confirmCancel.disabled = false;
    els.confirmCancel.textContent = "Yes, Cancel event";
  }
}

/* ---------------- EVENTS ---------------- */

els.cancelBtn.addEventListener("click", () => {
  if (!validateEventId()) return;
  openModal();
});

els.goBackBtn.addEventListener("click", () => {
  window.history.back();
});

[els.closeModal, els.cancelModal].forEach((btn) => {
  btn.addEventListener("click", hideModal);
});

els.confirmCancel.addEventListener("click", cancelEvent);

els.logoutBtn.addEventListener("click", () => {
  logout(ROUTES.organizerLogin);
});

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  await requireRole("organizer", ROUTES.organizerLogin);

  if (!validateEventId()) return;
});