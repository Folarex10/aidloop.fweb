export const API_BASE_URL =
  "https://aidloop-backend.onrender.com/api";

/* ==================================================
   CENTRALIZED ROUTES
================================================== */

export const ROUTES = {

  /* ---------------- PUBLIC ---------------- */

  home: "/index.html",

  /* ---------------- ADMIN ---------------- */

  adminLogin:
    "/Admin/login/admin-login.html",

  adminDashboard:
    "/Admin/dashboard/admin-dashboard.html",

  adminProfile:
    "/Admin/profile/admin-profile.html",

  adminVerificationQueue:
    "/Admin/verification/verification-queue.html",

  adminOrganizations:
    "/Admin/organizations/organization-directory.html",

  adminEvents:
    "/Admin/events/events-oversight.html",

  adminFlags:
    "/Admin/flags/flags.html",

  adminUsers:
    "/Admin/users/user-management.html",

  adminCertificates:
    "/Admin/certificates/certificates.html",

  /* ---------------- ORGANIZER ---------------- */

  organizerLogin:
    "/Organizer/login/organizer-login.html",

  organizerSignup:
    "/Organizer/signup/organizer-signup.html",

  organizerVerifyEmail:
    "/Organizer/verify-email/verify-email.html",

  organizerEmailVerified:
    "/Organizer/email-verified/email-verified.html",

  organizerDashboard:
    "/Organizer/dashboard/organizer-dashboard.html",

  organizerCreateEvent:
    "/Organizer/events/create-event.html",

  organizerEventListing:
    "/Organizer/events/event-listing.html",

  organizerEventDetails:
    "/Organizer/events/event-details.html",

  organizerCancelEvent:
    "/Organizer/events/cancel-event.html",

  organizerVolunteers:
    "/Organizer/volunteers/volunteers.html",

  organizerCertificates:
    "/Organizer/certificates/organizer-certificates.html",

  organizerProfile:
    "/Organizer/profile/organizer-profile.html"
};
