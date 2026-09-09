/**
 * js/auth.js — Customer auth.
 * JWT stored in localStorage under "hubator_token".
 * No secrets here — public repo.
 */

const TOKEN_KEY    = "hubator_token";
const CUSTOMER_KEY = "hubator_customer";

// ── Token helpers ─────────────────────────────────────────────────────────────

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}

function _parseJwtExpiry(token) {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return 0;
    const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
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
  if (typeof token !== "string" || !token || !customer || customer.id == null) {
    throw new Error("The sign-in response was invalid. Please try again.");
  }
  try {
    localStorage.setItem(TOKEN_KEY, token);
    // Only store non-sensitive display info in localStorage
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify({
      id:    customer.id,
      name:  customer.name,
      email: customer.email,
    }));
  } catch {
    clearSession();
    throw new Error("Unable to save your sign-in in this browser.");
  }
  window.dispatchEvent(new CustomEvent("hubator:auth-changed"));
}

function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
  } catch { /* Storage may be disabled. */ }
}

function getStoredCustomer() {
  try {
    const customer = JSON.parse(localStorage.getItem(CUSTOMER_KEY));
    return customer && typeof customer === "object" ? customer : null;
  }
  catch { return null; }
}

function currentCustomer() {
  const customer = isSignedIn() ? getStoredCustomer() : null;
  return customer && customer.email ? customer : null;
}

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
  window.dispatchEvent(new CustomEvent("hubator:auth-changed"));
  window.location.href = "index.html";
}

function safeNextPath(value, fallback = "index.html") {
  if (typeof value !== "string" || !value) return fallback;
  try {
    const url = new URL(value, location.href);
    if (url.origin !== location.origin || value.startsWith("//")) return fallback;
    return url.href;
  } catch {
    return fallback;
  }
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
    if (nameEl) nameEl.textContent     = String(customer.name || customer.email).split(" ")[0];
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

window.addEventListener("storage", (event) => {
  if (event.key === TOKEN_KEY || event.key === CUSTOMER_KEY || event.key === null) {
    updateHeaderAuth();
    window.dispatchEvent(new CustomEvent("hubator:auth-changed"));
  }
});
