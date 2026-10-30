import { login } from "../auth.js";

const form = document.getElementById("login-form");
const submitBtn = document.getElementById("submit-btn");
const alertBox = document.getElementById("alert-box");

// ---- Password show/hide ----
document.querySelectorAll(".toggle-eye").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const icon = btn.querySelector("i");
    if (input.type === "password") {
      input.type = "text";
      icon.className = "bi bi-eye-slash";
    } else {
      input.type = "password";
      icon.className = "bi bi-eye";
    }
  });
});

function showAlert(message, type = "danger") {
  alertBox.className = `alert app-alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.style.display = "block";
}

function clearAlert() {
  alertBox.style.display = "none";
}

// ---- Forgot password ----
document.getElementById("forgot-link").addEventListener("click", (e) => {
  e.preventDefault();
  window.staynest.toast(
    "Password reset isn't available in this demo. Use a demo account: tenant@staynest.in / Password@123",
    "info",
    6000
  );
});

// ---- Demo login buttons ----
document.getElementById("demo-tenant").addEventListener("click", () => {
  document.getElementById("email").value = "tenant@staynest.in";
  document.getElementById("password").value = "Password@123";
  document.getElementById("email").classList.remove("is-invalid");
  document.getElementById("password").classList.remove("is-invalid");
  clearAlert();
  window.staynest.toast("Demo tenant credentials filled. Click Log in.", "info", 2500);
});

document.getElementById("demo-owner").addEventListener("click", () => {
  document.getElementById("email").value = "owner@staynest.in";
  document.getElementById("password").value = "Password@123";
  document.getElementById("email").classList.remove("is-invalid");
  document.getElementById("password").classList.remove("is-invalid");
  clearAlert();
  window.staynest.toast("Demo owner credentials filled. Click Log in.", "info", 2500);
});

// ---- Submit ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  const email = document.getElementById("email");
  const password = document.getElementById("password");
  let valid = true;

  if (!email.checkValidity()) {
    email.classList.add("is-invalid");
    valid = false;
  } else {
    email.classList.remove("is-invalid");
  }
  if (!password.value) {
    password.classList.add("is-invalid");
    valid = false;
  } else {
    password.classList.remove("is-invalid");
  }
  if (!valid) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-spinner"></span> Logging in...';

  try {
    const result = await login({ email: email.value.trim(), password: password.value });
    window.staynest.toast(`Welcome back, ${result.user.fullName.split(" ")[0]}!`, "success");
    setTimeout(() => {
      const redirect = new URLSearchParams(location.search).get("redirect");
      // redirect back to previous page if provided, else index
      window.location.href = redirect || "/index.html";
    }, 700);
  } catch (err) {
    showAlert(err.message || "Invalid email or password.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Log in";
  }
});

// Clear validation on input
form.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("is-invalid");
    clearAlert();
  });
});
