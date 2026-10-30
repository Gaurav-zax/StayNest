// Client-side auth module for StayNest.
// Talks to /api/auth/* (served by the Vite server middleware in server/auth-server.ts).

const TOKEN_KEY = "staynest_token";
const USER_KEY = "staynest_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken() && !!getUser();
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function signup({ fullName, email, phone, role, password }) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, phone, role, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors
      ? data.errors.join(" ")
      : data.error || "Sign-up failed. Please try again.";
    throw new Error(msg);
  }
  if (data.token) setAuth(data.token, data.user);
  return data;
}

export async function login({ email, password }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Invalid email or password.");
  }
  setAuth(data.token, data.user);
  return data;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    clearAuth();
    return null;
  }
  const data = await res.json();
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  clearAuth();
}
