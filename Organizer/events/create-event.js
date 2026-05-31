import { apiRequest } from "../../assets/js/api.js";
import { requireOrganizer } from "../../assets/js/auth.js";
import { logout } from "../../assets/js/logout.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  form: document.getElementById("eventForm"),
  name: document.getElementById("name"),
  category: document.getElementById("category"),
  description: document.getElementById("description"),
  venue: document.getElementById("venue"),
  city: document.getElementById("city"),
  date: document.getElementById("date"),
  startTime: document.getElementById("startTime"),
  endTime: document.getElementById("endTime"),
  slots: document.getElementById("slots"),
  requirements: document.getElementById("requirements"),
  certificateEnabled: document.getElementById("certificateEnabled"),

  roleInput: document.getElementById("roleInput"),
  addRole: document.getElementById("addRole"),
  rolesList: document.getElementById("rolesList"),

  imageInput: document.getElementById("imageInput"),
  imageBox: document.getElementById("imageBox"),

  saveDraft: document.getElementById("saveDraft"),
  formMsg: document.getElementById("formMsg"),
  logoutBtn: document.getElementById("logoutBtn")
};

const eventId = new URLSearchParams(window.location.search).get("id");

let roles = [];
let imageFile = null;
let isEditMode = false;

/* ---------------- MESSAGE ---------------- */

function setMessage(message, type = "") {
  if (!els.formMsg) return;

  els.formMsg.textContent = message;
  els.formMsg.className = "form-message";
  if (type) els.formMsg.classList.add(type);
}

/* ---------------- ROLES ---------------- */

function renderRoles() {
  els.rolesList.innerHTML = roles
    .map((role, i) => `
      <span class="role-chip">
        ${role}
        <button type="button" data-index="${i}" class="remove-role-btn">&times;</button>
      </span>
    `)
    .join("");

  document.querySelectorAll(".remove-role-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      roles.splice(Number(btn.dataset.index), 1);
      renderRoles();
    });
  });
}

/* ---------------- IMAGE ---------------- */

function handleImageChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  imageFile = file;

  const preview = URL.createObjectURL(file);
  els.imageBox.innerHTML = `<img src="${preview}" style="max-width:100%; border-radius:12px;">`;
}

/* ---------------- VALIDATION ---------------- */

function validateForm() {
  if (!els.name.value.trim()) return "Event name is required";
  if (!els.date.value) return "Event date is required";
  if (!els.slots.value) return "Volunteer slots required";
  return null;
}

/* ---------------- PAYLOAD ---------------- */

function getPayload() {
  return {
    name: els.name.value.trim(),
    category: els.category.value.trim(),
    description: els.description.value.trim(),
    location: {
      venue: els.venue.value.trim(),
      city: els.city.value.trim()
    },
    date: els.date.value,
    startTime: els.startTime.value.trim(),
    endTime: els.endTime.value.trim(),
    volunteerSlots: Number(els.slots.value || 0),
    roles,
    certificateEnabled: els.certificateEnabled.checked,
    requirements: els.requirements.value
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean)
  };
}

/* ---------------- CREATE / UPDATE ---------------- */

async function submitEvent(status = "published") {
  const error = validateForm();
  if (error) {
    setMessage(error, "error");
    return;
  }

  try {
    setMessage("Saving event...");
    els.form.querySelector("button[type='submit']").disabled = true;

    const payload = getPayload();

    let res;

    if (isEditMode) {
      res = await apiRequest(`/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      res = await apiRequest("/events", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    const id =
      res?._id || res?.id || res?.event?._id || res?.event?.id;

    if (status === "published") {
      await apiRequest(`/events/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "published" })
      });
    }

    setMessage(
      status === "published"
        ? "Event published successfully!"
        : "Draft saved successfully!",
      "success"
    );

    setTimeout(() => {
      window.location.href = ROUTES.organizerDashboard;
    }, 800);

  } catch (err) {
    setMessage(err.message || "Something went wrong", "error");
  } finally {
    els.form.querySelector("button[type='submit']").disabled = false;
  }
}

/* ---------------- LOAD (EDIT MODE) ---------------- */

async function loadEvent() {
  if (!eventId) return;

  try {
    const data = await apiRequest(`/events/${eventId}`);

    isEditMode = true;

    els.name.value = data.name || "";
    els.category.value = data.category || "";
    els.description.value = data.description || "";
    els.venue.value = data.location?.venue || "";
    els.city.value = data.location?.city || "";
    els.date.value = data.date || "";
    els.startTime.value = data.startTime || "";
    els.endTime.value = data.endTime || "";
    els.slots.value = data.volunteerSlots || 0;
    els.requirements.value = (data.requirements || []).join("\n");

    roles = data.roles || [];
    renderRoles();

    if (data.image) {
      els.imageBox.innerHTML = `<img src="${data.image}" style="max-width:100%; border-radius:12px;">`;
    }

  } catch (err) {
    setMessage("Failed to load event data", "error");
  }
}

/* ---------------- UI ---------------- */

function bindUI() {
  els.addRole?.addEventListener("click", () => {
    const val = els.roleInput.value.trim();
    if (!val || roles.includes(val)) return;

    roles.push(val);
    els.roleInput.value = "";
    renderRoles();
  });

  els.imageInput?.addEventListener("change", handleImageChange);

  els.form?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitEvent("published");
  });

  els.saveDraft?.addEventListener("click", (e) => {
    e.preventDefault();
    submitEvent("draft");
  });

  els.logoutBtn?.addEventListener("click", () => {
    logout(ROUTES.organizerLogin);
  });
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  await requireOrganizer();

  bindUI();
  await loadEvent();
});