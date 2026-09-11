/**
 * js/auth.js — Customer auth.
 * Session tokens are kept in sessionStorage so they do not persist after the
 * browser session ends. Display-only customer details use the same scope.
 */

const TOKEN_KEY    = "hubator_token";
const CUSTOMER_KEY = "hubator_customer";

// ── Token helpers ─────────────────────────────────────────────────────────────

function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY); }
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
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify({
      id:    customer.id,
      name:  customer.name,
      email: customer.email,
    }));
    // Remove sessions created by older storefront versions.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
  } catch {
    clearSession();
    throw new Error("Unable to save your sign-in in this browser.");
  }
  window.dispatchEvent(new CustomEvent("hubator:auth-changed"));
}

function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(CUSTOMER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
  } catch { /* Storage may be disabled. */ }
}

function getStoredCustomer() {
  try {
    const customer = JSON.parse(sessionStorage.getItem(CUSTOMER_KEY));
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

  if (!res.ok) {
    const error = new Error(data.error || "Something went wrong. Please try again.");
    if (data.code) error.code = data.code;
    throw error;
  }
  return data;
}

async function authGet(path) {
  return authRequest(path, "GET");
}

async function authRequest(path, method, body) {
  const url = hubatorApiUrl(path);
  if (!url) throw new Error("Store API URL is not configured.");

  let res;
  try {
    res = await fetch(url, {
      method: method || "GET",
      headers: Object.assign(
        { Authorization: "Bearer " + getToken() },
        body === undefined ? {} : { "Content-Type": "application/json" }
      ),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* non-JSON */ }

  if (res.status === 401 || res.status === 404) {
    clearSession();
    window.dispatchEvent(new CustomEvent("hubator:auth-changed"));
    throw new Error(res.status === 404
      ? "This account is no longer available. Please sign in again."
      : "Your session has expired. Please sign in again.");
  }
  if (!res.ok) throw new Error(data.error || "Unable to complete that account request.");
  return data;
}

async function fetchCurrentCustomer() {
  if (!isSignedIn()) throw new Error("Please sign in to view your account.");
  const data = await authGet("/api/public/auth/me");
  if (!data.customer || !data.customer.email) {
    throw new Error("Your account could not be loaded. Please sign in again.");
  }
  try {
    sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify({
      id: data.customer.id,
      name: data.customer.name,
      email: data.customer.email,
    }));
  } catch { /* The API response is still usable for this page. */ }
  return data.customer;
}

// ── Public auth functions ─────────────────────────────────────────────────────

async function signUp(name, email, password) {
  const data = await authPost("/api/public/auth/signup", { name, email, password });
  // Signup doesn't log in — verification email sent first
  return data;
}

async function resendVerification(email) {
  return authPost("/api/public/auth/send-verification", { email });
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
  if (!window.confirm("Are you sure you want to sign out?")) return;
  clearSession();
  updateHeaderAuth();
  window.dispatchEvent(new CustomEvent("hubator:auth-changed"));
  window.location.href = "/";
}

function safeNextPath(value, fallback = "/") {
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
  const accountEl = document.querySelector(".header-account-link");

  if (customer && isSignedIn()) {
    if (signInEl) signInEl.style.display = "none";
    if (userEl)   userEl.style.display   = "flex";
    const displayName = String(customer.name || customer.email);
    if (accountEl) {
      accountEl.querySelector("span").textContent = displayName;
      accountEl.setAttribute("aria-label", "Open account for " + displayName);
    }
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
