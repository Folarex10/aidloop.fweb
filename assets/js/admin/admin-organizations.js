import { fetchOrganizers, applyOverrides, getVerificationStatus } from "./admin-verification.js";

export function getDisplayName(user) {
  return user.fullName || user.name || user.organizationName || "Unnamed Organizer";
}

export function getLocation(user) {
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

export function getStatusLabel(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Awaiting";
}

export function sortNewestFirst(list) {
  return [...list].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || a.dateCreated || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || b.dateCreated || 0).getTime();
    return bTime - aTime;
  });
}

export async function fetchOrganizationDirectory() {
  const organizers = await fetchOrganizers();

  return sortNewestFirst(
    applyOverrides(organizers).map((organizer) => ({
      ...organizer,
      _status: organizer._verificationStatus || getVerificationStatus(organizer)
    }))
  );
}

export function filterOrganizations(list, filterValue, query) {
  const normalizedQuery = query.trim().toLowerCase();

  return list.filter((organizer) => {
    const matchesFilter =
      filterValue === "all" ? true : organizer._status === filterValue;

    const searchableText = `
      ${getDisplayName(organizer)}
      ${organizer.email || ""}
      ${getLocation(organizer)}
      ${organizer._status}
    `.toLowerCase();

    return matchesFilter && searchableText.includes(normalizedQuery);
  });
}