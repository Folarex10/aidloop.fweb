import { apiRequest } from "../../assets/js/api.js";
import { ROUTES } from "../../assets/js/config.js";

const els = {
  loginForm: document.getElementById("loginForm"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  rememberMe: document.getElementById("rememberMe"),
  loginBtn: document.getElementById("loginBtn"),
  forgotPasswordBtn: document.getElementById("forgotPasswordBtn"),
  togglePassword: document.getElementById("togglePassword"),
  emailError: document.getElementById("emailError"),
  passwordError: document.getElementById("passwordError"),
  formError: document.getElementById("formError"),
  formSuccess: document.getElementById("formSuccess")
};

/* ---------------- VALIDATION ---------------- */

function clearErrors() {
  els.emailError.textContent = "";
  els.passwordError.textContent = "";
  els.formError.textContent = "";
  els.formSuccess.textContent = "";
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm() {
  clearErrors();

  const email = els.email.value.trim();
  const password = els.password.value.trim();

  let valid = true;

  if (!email) {
    els.emailError.textContent = "Email is required";
    valid = false;
  } else if (!validateEmail(email)) {
    els.emailError.textContent = "Invalid email format";
    valid = false;
  }

  if (!password) {
    els.passwordError.textContent = "Password is required";
    valid = false;
  }

  return valid;
}

/* ---------------- UI ---------------- */

function restoreRememberedEmail() {
  const saved = localStorage.getItem("aidloop_admin_email");
  if (saved) {
    els.email.value = saved;
    els.rememberMe.checked = true;
  }
}

function togglePasswordVisibility() {
  const isHidden = els.password.type === "password";
  els.password.type = isHidden ? "text" : "password";

  els.togglePassword.innerHTML = isHidden
    ? '<i class="fa-regular fa-eye"></i>'
    : '<i class="fa-regular fa-eye-slash"></i>';
}

/* ---------------- LOGIN ---------------- */

async function handleLogin(e) {
  e.preventDefault();

  if (!validateForm()) return;

  try {
    clearErrors();

    els.loginBtn.disabled = true;
    els.loginBtn.textContent = "Logging in...";

    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: els.email.value.trim(),
        password: els.password.value.trim()
      })
    });

    const role = String(res?.user?.role || res?.role || "").toLowerCase();

    if (role !== "admin") {
      throw new Error("Access denied: Admins only");
    }

    // Remember email
    if (els.rememberMe.checked) {
      localStorage.setItem("aidloop_admin_email", els.email.value.trim());
    } else {
      localStorage.removeItem("aidloop_admin_email");
    }

    els.formSuccess.textContent = "Login successful";

    // 🔥 IMPORTANT: redirect using ROUTES
    setTimeout(() => {
      window.location.href = ROUTES.dashboard;
    }, 800);

  } catch (err) {
    els.formError.textContent = err.message || "Login failed";
  } finally {
    els.loginBtn.disabled = false;
    els.loginBtn.textContent = "Log in";
  }
}

/* ---------------- FORGOT PASSWORD ---------------- */

function handleForgotPassword() {
  clearErrors();
  els.formError.textContent = "Forgot password not implemented yet.";
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  restoreRememberedEmail();

  els.loginForm.addEventListener("submit", handleLogin);
  els.togglePassword.addEventListener("click", togglePasswordVisibility);
  els.forgotPasswordBtn.addEventListener("click", handleForgotPassword);
});