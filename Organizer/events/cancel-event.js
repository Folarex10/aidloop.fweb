import { apiRequest } from "../../assets/js/api.js";
import {
  requireOrganizer,
  loadOrganizerProfile
} from "../../assets/js/organizer/organizer-auth.js";
import { ROUTES } from "../../assets/js/config.js";
import { initLogoutModal } from "../../assets/js/logout.js";

/* ==================================================
   ELEMENTS
================================================== */

const els = {

  organizerAvatar:
    document.getElementById("organizerAvatar"),

  cancelEventBtn:
    document.getElementById("cancelEventBtn"),

  goBackBtn:
    document.getElementById("goBackBtn"),

  reasonText:
    document.getElementById("reasonText"),

  reasonChecks:
    document.querySelectorAll(
      ".checkbox-grid input"
    ),

  confirmModal:
    document.getElementById("confirmModal"),

  closeModal:
    document.getElementById("closeModal"),

  cancelModal:
    document.getElementById("cancelModal"),

  confirmCancel:
    document.getElementById("confirmCancel"),

  logoutBtn:
    document.getElementById("logoutBtn"),

  // logoutModal:
  //   document.getElementById("logoutModal"),

  // closeLogoutModal:
  //   document.getElementById("closeLogoutModal"),

  // cancelLogout:
  //   document.getElementById("cancelLogout"),

  // confirmLogout:
  //   document.getElementById("confirmLogout"),

  pageTitle:
    document.querySelector(".page-title")

};

const eventId =
  new URLSearchParams(
    window.location.search
  ).get("id");

let organizer = null;

let eventData = null;

let selectedReason = "";

/* ==================================================
   LOAD EVENT
================================================== */

async function loadEvent() {

  if (!eventId) {

    alert("Invalid event.");

    window.location.href =
      ROUTES.organizerEventListing;

    return;

  }

  try {

    const response =
      await apiRequest(`/events/${eventId}`);

    eventData =
      response.data ||
      response.event ||
      response;

    if (els.pageTitle) {

      els.pageTitle.textContent =
        `Cancel ${eventData.name}`;

    }

  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Unable to load event."
    );

    window.location.href =
      ROUTES.organizerEventListing;

  }

}

/* ==================================================
   REASON
================================================== */

function bindReasons() {

  els.reasonChecks.forEach((checkbox) => {

    checkbox.addEventListener(
      "change",
      () => {

        els.reasonChecks.forEach((item) => {

          if (item !== checkbox) {

            item.checked = false;

          }

        });

        selectedReason =
          checkbox.checked
            ? checkbox.value
            : "";

      }
    );

  });

}

/* ==================================================
   VALIDATION
================================================== */

function validateForm() {

  if (!selectedReason) {

    alert(
      "Please select a cancellation reason."
    );

    return false;

  }

  if (
    selectedReason === "Other" &&
    !els.reasonText.value.trim()
  ) {

    alert(
      "Please provide additional details."
    );

    els.reasonText.focus();

    return false;

  }

  return true;

}

/* ==================================================
   MODAL
================================================== */

function openConfirmModal() {

  if (!validateForm()) return;

  els.confirmModal
    ?.classList.remove("hidden");

}

function closeConfirmModal() {

  els.confirmModal
    ?.classList.add("hidden");

}
/* ==================================================
   CANCEL EVENT
================================================== */

async function submitCancellation() {

  try {

    els.confirmCancel.disabled = true;
    els.confirmCancel.textContent = "Cancelling...";

    const payload = {
      reason: selectedReason,
      note:
        selectedReason === "Other"
          ? els.reasonText.value.trim()
          : els.reasonText.value.trim() || null
    };

    await apiRequest(
      `/events/${eventId}/cancel`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      }
    );

    closeConfirmModal();

    alert(
      "Event cancelled successfully.\nRegistered volunteers will be notified."
    );

    window.location.href =
      ROUTES.organizerEventListing;

  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      "Unable to cancel event."
    );

  } finally {

    els.confirmCancel.disabled = false;
    els.confirmCancel.textContent =
      "Yes, Cancel event";

  }

}

/* ==================================================
   GO BACK
================================================== */

function goBack() {

  if (eventId) {

    window.location.href =
      `${ROUTES.organizerEventDetails}?id=${encodeURIComponent(eventId)}`;

    return;

  }

  window.location.href =
    ROUTES.organizerEventListing;

}

/* ==================================================
   UI
================================================== */

function bindUI() {

  bindReasons();

  els.cancelEventBtn?.addEventListener(
    "click",
    openConfirmModal
  );

  els.goBackBtn?.addEventListener(
    "click",
    goBack
  );

  els.confirmCancel?.addEventListener(
    "click",
    submitCancellation
  );

  els.cancelModal?.addEventListener(
    "click",
    closeConfirmModal
  );

  els.closeModal?.addEventListener(
    "click",
    closeConfirmModal
  );

  els.confirmModal?.addEventListener(
    "click",
    (event) => {

      if (
        event.target === els.confirmModal
      ) {

        closeConfirmModal();

      }

    }
  );

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        !els.confirmModal
          ?.classList.contains("hidden")
      ) {

        closeConfirmModal();

      }

    }
  );

}
/* ==================================================
   INIT
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    await requireOrganizer();

    await loadOrganizerProfile({
      avatarEl: document.getElementById(
        "organizerAvatar"
      )
    });

    // initLogoutModal({
    //   logoutBtn: "#logoutBtn",
    //   modal: "#logoutModal",
    //   closeBtn: "#closeLogoutModal",
    //   cancelBtn: "#cancelLogout",
    //   confirmBtn: "#confirmLogout",
    //   redirectTo: ROUTES.organizerLogin
    // });

    initLogoutModal({

    triggerSelector: "#logoutBtn",

    message:
        "You are about to end your current organizer session.",

    redirectTo:
        ROUTES.organizerLogin

});

    bindUI();

    await loadEvent();

  }
);