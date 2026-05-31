import { apiRequest } from "../api.js";
import { normalizeUsers } from "../utils.js";

const STORAGE_KEY = "aidloop_verification_status_overrides";

export function getStoredOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveOverride(id, status) {
  const overrides = getStoredOverrides();
  overrides[String(id)] = {
    status,
    updatedAt: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function getVerificationStatus(user) {
  const status = String(user.status || "").toLowerCase();
  const approval = String(user.approvalStatus || "").toLowerCase();
  const isVerified = Boolean(user.isVerified);

  if (status === "rejected" || approval === "rejected") return "rejected";

  if (
    status === "approved" ||
    approval === "approved" ||
    status === "verified" ||
    approval === "verified" ||
    isVerified
  ) return "approved";

  return "awaiting";
}

export function applyOverrides(list) {
  const overrides = getStoredOverrides();

  return list.map((org) => {
    const id = String(org._id || org.id || "");
    const override = overrides[id];

    if (!override) {
      return {
        ...org,
        _verificationStatus: getVerificationStatus(org)
      };
    }

    return {
      ...org,
      status: override.status,
      approvalStatus: override.status,
      isVerified: override.status === "approved",
      _verificationStatus: override.status
    };
  });
}

export async function fetchOrganizers() {
  let payload;

  try {
    payload = await apiRequest("/user");
  } catch {
    payload = await apiRequest("/users");
  }

  return normalizeUsers(payload)
    .filter(u => String(u.role).toLowerCase() === "organizer");
}