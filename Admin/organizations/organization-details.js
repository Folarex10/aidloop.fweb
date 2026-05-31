import { fetchOrganizers, getStoredOverrides, getVerificationStatus } from "../../assets/js/admin/admin-verification.js";
import { getDisplayName, getLocation } from "../../assets/js/admin/admin-organizations.js";

const els = {
  closeBtn: document.getElementById("closeBtn"),
  orgTitle: document.getElementById("orgTitle"),
  statusBadge: document.getElementById("statusBadge"),
  orgName: document.getElementById("orgName"),
  socialLinks: document.getElementById("socialLinks"),
  email: document.getElementById("email"),
  phoneNumber: document.getElementById("phoneNumber"),
  location: document.getElementById("location"),
  description: document.getElementById("description")
};

const organizerId = new URLSearchParams(window.location.search).get("id");

function setStatusBadge(status) {
  els.statusBadge.textContent =
    status === "approved"
      ? "Approved"
      : status === "rejected"
      ? "Rejected"
      : "Awaiting";

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
  els.description.innerHTML = `<p>${
    user.description ||
    user.bio ||
    "No organization description available."
  }</p>`;

  renderSocialLinks(user);
  setStatusBadge(status);
}

async function loadOrganizerDetails() {
  if (!organizerId) {
    els.orgTitle.textContent = "No organizer selected";
    els.description.innerHTML = "<p>No organizer ID provided.</p>";
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
    els.description.innerHTML = `<p>${error.message || "Failed to fetch organizer details."}</p>`;
  }
}

function closeModal() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = "organization-directory.html";
}

els.closeBtn.addEventListener("click", closeModal);

document.addEventListener("DOMContentLoaded", loadOrganizerDetails);