/**
 * js/auth.js — Customer auth.
 * JWT stored in localStorage under "hubator_token".
 * No secrets here — public repo.
 */

const TOKEN_KEY    = "hubator_token";
const CUSTOMER_KEY = "hubator_customer";

// ── Token helpers ─────────────────────────────────────────────────────────────

function getToken() { return localStorage.getItem(TOKEN_KEY); }

function _parseJwtExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : Infinity;
  } catch { return 0; }
}

function isSignedIn() {
  const token = getToken();
  if (!token) return false;
  // Check token hasn't expired
  return _parseJwtExpiry(token) > Date.now();
}

function saveSession(token, customer) {
  localStorage.setItem(TOKEN_KEY, token);
  // Only store non-sensitive display info in localStorage
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify({
    id:    customer.id,
    name:  customer.name,
    email: customer.email,
  }));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
}

function getStoredCustomer() {
  try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || null; }
  catch { return null; }
}

function currentCustomer() { return isSignedIn() ? getStoredCustomer() : null; }

// ── API helpers ───────────────────────────────────────────────────────────────

async function authPost(path, body) {
  const url = hubatorApiUrl(path);
  if (!url) throw new Error("Store API URL is not configured.");

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* non-JSON */ }

  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

// ── Public auth functions ─────────────────────────────────────────────────────

async function signUp(name, email, password) {
  const data = await authPost("/api/public/auth/signup", { name, email, password });
  // Signup doesn't log in — verification email sent first
  return data;
}

async function signIn(email, password) {
  const data = await authPost("/api/public/auth/login", { email, password });
  saveSession(data.token, data.customer);
  updateHeaderAuth();
  return data;
}

async function forgotPassword(email) {
  return authPost("/api/public/auth/forgot-password", { email });
}

async function resetPassword(token, password) {
  const data = await authPost("/api/public/auth/reset-password", { token, password });
  saveSession(data.token, data.customer);
  updateHeaderAuth();
  return data;
}

function signOut() {
  clearSession();
  updateHeaderAuth();
  window.location.href = "index.html";
}

// ── Header state ──────────────────────────────────────────────────────────────

function updateHeaderAuth() {
  const customer  = currentCustomer();
  const signInEl  = document.querySelector(".header-signin");
  const userEl    = document.querySelector(".header-user");
  const nameEl    = document.querySelector(".header-user-name");

  if (customer && isSignedIn()) {
    if (signInEl) signInEl.style.display = "none";
    if (userEl)   userEl.style.display   = "flex";
    if (nameEl)   nameEl.textContent     = customer.name.split(" ")[0];
  } else {
    clearSession(); // wipe any expired token silently
    if (signInEl) signInEl.style.display = "";
    if (userEl)   userEl.style.display   = "none";
  }
}

// ── Inline form helpers ───────────────────────────────────────────────────────

function showAuthError(formId, message) {
  const el = document.getElementById(formId + "-error");
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
}

function clearAuthError(formId) {
  const el = document.getElementById(formId + "-error");
  if (!el) return;
  el.textContent = "";
  el.style.display = "none";
}

// ── Run on every page ─────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", updateHeaderAuth);
