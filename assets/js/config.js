export const API_BASE_URL = "https://aidloop-backend.onrender.com/api";

export const ROUTES = {
  /* HOME */
  home: "/index.html",

  /* =========================
     ADMIN
  ========================= */
  adminLogin: "/Admin/login/admin-login.html",
  adminDashboard: "/Admin/dashboard/admin-dashboard.html",
  adminVerification: "/Admin/verification/verification-queue.html",
  adminOrganizations: "/Admin/organizations/organization-directory.html",
  adminEvents: "/Admin/events/events-oversight.html",
  adminProfile: "/Admin/profile/admin-profile.html",

  /* =========================
     ORGANIZER
  ========================= */
  organizerLogin: "/Organizer/login/organizer-login.html",
  organizerSignup: "/Organizer/signup/organizer-signup.html",
  organizerDashboard: "/Organizer/dashboard/organizer-dashboard.html",
  organizerProfile: "/Organizer/profile/organizer-profile.html",

  /* EVENTS */
  organizerEvents: "/Organizer/events/event-listing.html",
  organizerCreateEvent: "/Organizer/events/create-event.html",

  /* VOLUNTEERS */
  organizerVolunteers: "/Organizer/volunteers/volunteers.html",

  /* CERTIFICATES */
  organizerCertificates: "/Organizer/certificates/organizer-certificates.html",

  /* EMAIL */
  organizerVerifyEmail: "/Organizer/verify-email/verify-email.html",
  organizerEmailVerified: "/Organizer/email-verified/email-verified.html"
};