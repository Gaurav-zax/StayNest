import { signup } from "../auth.js";

const form = document.getElementById("signup-form");
const roleInput = document.getElementById("role-input");
const submitBtn = document.getElementById("submit-btn");
const alertBox = document.getElementById("alert-box");

// ---- Role pills ----
document.querySelectorAll(".role-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".role-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    roleInput.value = pill.dataset.role;
  });
});

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

// ---- Phone numeric only ----
const phoneInput = document.getElementById("phone");
phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
});

function showAlert(message, type = "danger") {
  alertBox.className = `alert app-alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.style.display = "block";
  if (type === "success") {
    alertBox.classList.add("alert-success");
  }
}

function clearAlert() {
  alertBox.style.display = "none";
  alertBox.textContent = "";
}

// ---- Validation ----
function validateForm() {
  let valid = true;
  const fields = ["fullName", "email", "phone", "password", "confirmPassword"];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (id === "phone") {
      if (!/^[6-9]\d{9}$/.test(el.value)) {
        el.classList.add("is-invalid");
        valid = false;
      } else {
        el.classList.remove("is-invalid");
      }
    } else if (id === "password") {
      if (el.value.length < 8 || !/[a-zA-Z]/.test(el.value) || !/\d/.test(el.value)) {
        el.classList.add("is-invalid");
        valid = false;
      } else {
        el.classList.remove("is-invalid");
      }
    } else if (id === "confirmPassword") {
      if (el.value !== document.getElementById("password").value || !el.value) {
        el.classList.add("is-invalid");
        valid = false;
      } else {
        el.classList.remove("is-invalid");
      }
    } else {
      if (!el.checkValidity()) {
        el.classList.add("is-invalid");
        valid = false;
      } else {
        el.classList.remove("is-invalid");
      }
    }
  });
  // Terms checkbox
  const terms = document.getElementById("terms");
  if (!terms.checked) {
    terms.classList.add("is-invalid");
    document.getElementById("terms-error").style.display = "block";
    document.getElementById("terms-error").classList.remove("d-none");
    valid = false;
  } else {
    terms.classList.remove("is-invalid");
    document.getElementById("terms-error").style.display = "none";
  }
  return valid;
}

// ---- Submit ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  if (!validateForm()) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-spinner"></span> Creating your account...';

  try {
    const result = await signup({
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      role: roleInput.value,
      password: document.getElementById("password").value,
    });

    window.staynest.toast(`Welcome to StayNest, ${result.user.fullName.split(" ")[0]}!`, "success");
    setTimeout(() => {
      const redirect = new URLSearchParams(location.search).get("redirect");
      window.location.href = redirect || "/index.html";
    }, 800);
  } catch (err) {
    showAlert(err.message || "Sign-up failed. Please try again.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Create account";
  }
});

// Clear validation on input
form.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    if (input.id === "terms") {
      document.getElementById("terms-error").style.display = input.checked ? "none" : "block";
    } else {
      input.classList.remove("is-invalid");
    }
    clearAlert();
  });
});
