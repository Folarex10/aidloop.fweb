import { apiRequest } from "../../assets/js/api.js";
import {
  fetchOrganizers,
  getVerificationStatus,
  getStoredOverrides,
  saveOverride
} from "../../assets/js/admin/admin-verification.js";

const els = {
  orgTitle: document.getElementById("orgTitle"),
  statusBadge: document.getElementById("statusBadge"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  description: document.getElementById("description"),
  rejectBtn: document.getElementById("rejectBtn"),
  approveBtn: document.getElementById("approveBtn"),
  feedback: document.getElementById("feedback")
};

const organizerId = new URLSearchParams(window.location.search).get("id");

function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Organization";
}

function getLocation(user) {
  if (typeof user.location === "string" && user.location.trim()) {
    return user.location;
  }

  if (user.location && typeof user.location === "object") {
    return (
      [user.location.venue, user.location.city || user.location.state]
        .filter(Boolean)
        .join(", ") || "—"
    );
  }

  return user.city || user.state || "—";
}

function setStatusBadge(status) {
  els.statusBadge.textContent =
    status === "approved"
      ? "Approved"
      : status === "rejected"
      ? "Rejected"
      : "Awaiting Verification";

  els.statusBadge.className = "status-badge";
  els.statusBadge.classList.add(status);
}

function renderSocialLinks(user) {
  const link =
    user.website ||
    user.socialLink ||
    user.socialLinks?.[0] ||
    "";

  if (!link) {
    els.socialLinks.textContent = "—";
    return;
  }

  els.socialLinks.innerHTML = `
    <a class="social-link" href="${link}" target="_blank" rel="noopener noreferrer">
      ${link}
    </a>
  `;
}

function setFeedback(message, type = "") {
  els.feedback.textContent = message;
  els.feedback.className = "feedback";
  if (type) {
    els.feedback.classList.add(type);
  }
}

function mergeOrganizerWithOverride(organizer) {
  const overrides = getStoredOverrides();
  const override = overrides[String(organizerId)];

  if (!override?.status) {
    return organizer;
  }

  return {
    ...organizer,
    status: override.status,
    approvalStatus: override.status,
    isVerified: override.status === "approved"
  };
}

function populateOrganizer(user) {
  const status = getVerificationStatus(user);

  els.orgTitle.textContent = getDisplayName(user);
  els.orgName.textContent = getDisplayName(user);
  els.email.textContent = user.email || "—";
  els.phoneNumber.textContent = user.phoneNumber || user.phone || "—";
  els.location.textContent = getLocation(user);
  els.description.textContent =
    user.description ||
    user.bio ||
    "No organization description available.";

  renderSocialLinks(user);
  setStatusBadge(status);

  els.approveBtn.disabled = status === "approved";
  els.rejectBtn.disabled = status === "rejected";
}

async function loadOrganizerDetails() {
  if (!organizerId) {
    setFeedback("No organizer ID provided.", "error");
    els.rejectBtn.disabled = true;
    els.approveBtn.disabled = true;
    return;
  }

  try {
    const organizers = await fetchOrganizers();

    const organizer = organizers.find(
      (user) => String(user._id || user.id) === String(organizerId)
    );

    if (!organizer) {
      throw new Error("Organizer not found");
    }

    const mergedOrganizer = mergeOrganizerWithOverride(organizer);
    populateOrganizer(mergedOrganizer);
  } catch (error) {
    els.orgTitle.textContent = "Unable to load organizer";
    els.description.textContent = "Failed to fetch organizer details.";
    setFeedback(error.message || "Failed to load organizer details.", "error");
    els.rejectBtn.disabled = true;
    els.approveBtn.disabled = true;
  }
}

async function approveOrganizer() {
  if (!organizerId) return;

  try {
    els.approveBtn.disabled = true;
    els.rejectBtn.disabled = true;

    await apiRequest(`/admin/organizers/${organizerId}/approve`, {
      method: "PATCH"
    });

    saveOverride(organizerId, "approved");
    setStatusBadge("approved");
    setFeedback("Organizer approved successfully.", "success");

    setTimeout(() => {
      window.location.href = "verification-queue.html";
    }, 500);
  } catch (error) {
    els.approveBtn.disabled = false;
    els.rejectBtn.disabled = false;
    setFeedback(error.message || "Failed to approve organizer.", "error");
  }
}

async function rejectOrganizer() {
  if (!organizerId) return;

  try {
    els.approveBtn.disabled = true;
    els.rejectBtn.disabled = true;

    await apiRequest(`/admin/organizers/${organizerId}/reject`, {
      method: "PATCH"
    });

    saveOverride(organizerId, "rejected");
    setStatusBadge("rejected");
    setFeedback("Organizer rejected successfully.", "success");

    setTimeout(() => {
      window.location.href = "verification-queue.html";
    }, 500);
  } catch (error) {
    els.approveBtn.disabled = false;
    els.rejectBtn.disabled = false;
    setFeedback(error.message || "Failed to reject organizer.", "error");
  }
}

els.approveBtn.addEventListener("click", approveOrganizer);
els.rejectBtn.addEventListener("click", rejectOrganizer);

document.addEventListener("DOMContentLoaded", loadOrganizerDetails);