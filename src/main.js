// Navbar auth state + shared utilities, loaded on every StayNest page.

import { isLoggedIn, getUser, logout, fetchMe } from "./auth.js";

window.staynest = window.staynest || {};

// ---- Toast ----
function ensureToastHost() {
  let host = document.querySelector(".toast-host");
  if (!host) {
    host = document.createElement("div");
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  return host;
}

window.staynest.toast = function (message, type = "info", duration = 3500) {
  const host = ensureToastHost();
  const el = document.createElement("div");
  el.className = `sn-toast ${type}`;
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, duration);
};

// ---- Navbar rendering ----
function renderNavActions() {
  const actionsEl = document.getElementById("nav-actions");
  const mobileEl = document.getElementById("mobile-auth-area");
  if (!actionsEl) return;

  if (isLoggedIn()) {
    const user = getUser();
    const initials = (user?.fullName || "?")
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    actionsEl.innerHTML = `
      <div class="user-pill" id="userPill">
        <div class="user-avatar">${initials}</div>
        <span class="user-name d-none d-md-inline">Hi, ${escapeHtml(user?.fullName?.split(" ")[0] || "User")}</span>
        <span class="user-role-badge">${escapeHtml(user?.role || "Tenant")}</span>
        <i class="bi bi-chevron-down d-none d-md-inline" style="font-size:.7rem;color:var(--navy-300);"></i>
        <div class="user-dropdown" id="userDropdown">
          <div class="dd-head">
            <div style="font-weight:700;">${escapeHtml(user?.fullName || "")}</div>
            <small>${escapeHtml(user?.email || "")}</small>
          </div>
          <a href="/contact.html"><i class="bi bi-envelope"></i> Contact StayNest</a>
          <button id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Log out</button>
        </div>
      </div>
    `;

    const pill = document.getElementById("userPill");
    const dropdown = document.getElementById("userDropdown");
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });
    document.addEventListener("click", () => dropdown.classList.remove("show"));

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      logout();
      window.staynest.toast("Logged out successfully.", "success");
      setTimeout(() => location.reload(), 600);
    });

    if (mobileEl) {
      mobileEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:1rem;">
          <div class="user-avatar">${initials}</div>
          <div>
            <div style="font-weight:700;">${escapeHtml(user?.fullName || "")}</div>
            <small class="text-navy-500">${escapeHtml(user?.role || "Tenant")} • ${escapeHtml(user?.email || "")}</small>
          </div>
        </div>
        <button class="btn btn-outline-navy w-100" id="mLogoutBtn"><i class="bi bi-box-arrow-right me-1"></i> Log out</button>
      `;
      document.getElementById("mLogoutBtn")?.addEventListener("click", () => {
        logout();
        window.staynest.toast("Logged out successfully.", "success");
        setTimeout(() => location.reload(), 600);
      });
    }
  } else {
    actionsEl.innerHTML = `
      <a href="/login.html" class="btn btn-outline-navy btn-sm">Log in</a>
      <a href="/signup.html" class="btn btn-navy btn-sm">Sign up</a>
    `;
    if (mobileEl) {
      mobileEl.innerHTML = `
        <a href="/login.html" class="btn btn-outline-navy w-100 mb-2">Log in</a>
        <a href="/signup.html" class="btn btn-navy w-100">Sign up</a>
      `;
    }
  }
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

window.staynest.escapeHtml = escapeHtml;

// ---- Active nav link ----
function highlightNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.getAttribute("data-nav") === path.replace(".html", "")) {
      el.classList.add("active");
    }
  });
}

// ---- Auto-fill forms for logged-in users ----
function autoFillForms() {
  if (!isLoggedIn()) return;
  const user = getUser();
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val;
  };
  setVal("contact-name", user?.fullName || "");
  setVal("contact-email", user?.email || "");
  setVal("contact-phone", user?.phone || "");
  setVal("owner-contact-name", user?.fullName || "");
  setVal("owner-contact-email", user?.email || "");
  setVal("owner-contact-phone", user?.phone || "");
}

// ---- Init ----
async function init() {
  // If we have a token, verify it's still valid by refreshing user data
  if (isLoggedIn()) {
    await fetchMe().catch(() => {});
  }
  renderNavActions();
  highlightNav();
  autoFillForms();
}

window.staynest.refreshNav = renderNavActions;

document.addEventListener("DOMContentLoaded", init);
