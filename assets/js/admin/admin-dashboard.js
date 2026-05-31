import { apiRequest } from "../api.js";
import { normalizeUsers, normalizeEvents, formatDate } from "../utils.js";
import { applyOverrides } from "./admin-verification.js";

export async function fetchDashboardData() {
  const [usersPayload, eventsPayload] = await Promise.all([
    apiRequest("/user").catch(() => apiRequest("/users")),
    apiRequest("/events")
  ]);

  const users = normalizeUsers(usersPayload);
  const events = normalizeEvents(eventsPayload);

  const organizersRaw = users.filter(
    (u) => String(u.role || "").toLowerCase() === "organizer"
  );

  const organizers = applyOverrides(organizersRaw);

  const pending = organizers.filter(
    (u) => u._verificationStatus === "awaiting"
  );

  const activeUsers = users.filter((u) => u.isActive !== false);

  return {
    organizationCount: organizers.length,
    pendingCount: pending.length,
    eventsCount: events.length,
    activeUsersCount: activeUsers.length,
    activity: buildActivity(organizers, events)
  };
}

function buildActivity(organizers, events) {
  const list = [];

  organizers.slice(0, 5).forEach((u) => {
    if (u._verificationStatus === "awaiting") {
      list.push({
        activity: "Submitted for Verification",
        entity: u.fullName || u.email || "Organizer",
        date: u.createdAt || u.updatedAt,
        status: "Pending"
      });
    }

    if (u._verificationStatus === "approved") {
      list.push({
        activity: "Organization Approved",
        entity: u.fullName || u.email || "Organizer",
        date: u.updatedAt || u.createdAt,
        status: "Approved"
      });
    }

    if (u._verificationStatus === "rejected") {
      list.push({
        activity: "Organization Rejected",
        entity: u.fullName || u.email || "Organizer",
        date: u.updatedAt || u.createdAt,
        status: "Rejected"
      });
    }
  });

  events.slice(0, 5).forEach((e) => {
    list.push({
      activity: "Event Created",
      entity: e.name || "Untitled Event",
      date: e.createdAt || e.date,
      status: e.status || "Published"
    });
  });

  return list
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8)
    .map((item) => ({
      ...item,
      formattedDate: formatDate(item.date)
    }));
}