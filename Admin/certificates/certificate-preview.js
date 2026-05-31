import { apiRequest } from "../../assets/js/api.js";

/* ---------------- ELEMENTS ---------------- */

const els = {
  closeBtn: document.getElementById("closeBtn"),
  volunteerName: document.getElementById("volunteerName"),
  eventName: document.getElementById("eventName"),
  phoneNumber: document.getElementById("phoneNumber"),
  organizerName: document.getElementById("organizerName"),
  eventDate: document.getElementById("eventDate"),
  certificateStatus: document.getElementById("certificateStatus"),
  feedback: document.getElementById("feedback"),
  downloadBtn: document.getElementById("downloadBtn")
};

const certificateId = new URLSearchParams(window.location.search).get("id");

/* ---------------- HELPERS ---------------- */

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function setFeedback(message, type = "") {
  els.feedback.textContent = message;
  els.feedback.className = "feedback";
  if (type) els.feedback.classList.add(type);
}

function getVolunteerName(data) {
  return (
    data.user?.fullName ||
    data.volunteer?.fullName ||
    data.user?.name ||
    "—"
  );
}

function getEventName(data) {
  return data.event?.name || "—";
}

function getOrganizerName(data) {
  return (
    data.event?.organizer?.name ||
    data.organizer?.name ||
    "—"
  );
}

/* ---------------- POPULATE ---------------- */

function populateCertificate(data) {
  els.volunteerName.textContent = getVolunteerName(data);
  els.eventName.textContent = getEventName(data);

  els.phoneNumber.textContent =
    data.user?.phoneNumber ||
    data.user?.phone ||
    data.volunteer?.phone ||
    "—";

  els.organizerName.textContent = getOrganizerName(data);

  els.eventDate.textContent = formatDate(
    data.event?.date ||
    data.issuedAt ||
    data.createdAt
  );

  // 🔥 always issued in your system
  els.certificateStatus.textContent = "ISSUED";
}

/* ---------------- LOAD ---------------- */

async function loadCertificate() {
  if (!certificateId) {
    setFeedback("Invalid certificate link", "error");
    els.downloadBtn.disabled = true;
    return;
  }

  try {
    const data = await apiRequest(`/certificates/verify/${certificateId}`);
    populateCertificate(data);

  } catch (err) {
    setFeedback(err.message || "Failed to load certificate", "error");
    els.downloadBtn.disabled = true;
  }
}

/* ---------------- DOWNLOAD ---------------- */

async function downloadCertificate() {
  if (!certificateId) return;

  try {
    els.downloadBtn.disabled = true;
    els.downloadBtn.textContent = "Downloading...";

    const blob = await apiRequest(
      `/certificates/download/${certificateId}`,
      {
        method: "GET"
      }
    );

    if (!(blob instanceof Blob)) {
      throw new Error("Invalid file response");
    }

    const url = URL.createObjectURL(blob);

    // 🔥 better filename
    const fileName = `AidLoop-Certificate-${certificateId}.pdf`;

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setFeedback("Download successful", "success");

  } catch (err) {
    setFeedback(err.message || "Download failed", "error");
  } finally {
    els.downloadBtn.disabled = false;
    els.downloadBtn.textContent = "Download Certificate";
  }
}

/* ---------------- CLOSE ---------------- */

function closePreview() {
  window.location.href = "certificates.html";
}

/* ---------------- INIT ---------------- */

function bindUI() {
  els.closeBtn?.addEventListener("click", closePreview);
  els.downloadBtn?.addEventListener("click", downloadCertificate);
}

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  loadCertificate();
});