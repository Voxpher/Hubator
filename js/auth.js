/**
 * Hubator customer auth — connects to the dashboard's public auth API.
 * JWT stored in localStorage under "hubator_token".
 * No secrets here — this is a public repo.
 */

const TOKEN_KEY = "hubator_token";
const CUSTOMER_KEY = "hubator_customer";

// ─── Token helpers ────────────────────────────────────────────────────────────

function getToken() { return localStorage.getItem(TOKEN_KEY); }

function saveSession(token, customer) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
}

function getStoredCustomer() {
  try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || null; }
  catch { return null; }
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function authPost(path, body) {
  const res = await fetch(hubatorApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

/** Sign up a new customer. Returns { token, customer }. */
async function signUp(name, email, password) {
  const data = await authPost("/api/public/auth/signup", { name, email, password });
  saveSession(data.token, data.customer);
  updateHeaderAuth();
  return data;
}

/** Sign in with email + password. Returns { token, customer }. */
async function signIn(email, password) {
  const data = await authPost("/api/public/auth/login", { email, password });
  saveSession(data.token, data.customer);
  updateHeaderAuth();
  return data;
}

/** Send a forgot-password email. */
async function forgotPassword(email) {
  return authPost("/api/public/auth/forgot-password", { email });
}

/** Reset password using the token from the email link. */
async function resetPassword(token, password) {
  const data = await authPost("/api/public/auth/reset-password", { token, password });
  saveSession(data.token, data.customer);
  updateHeaderAuth();
  return data;
}

/** Sign out. */
function signOut() {
  clearSession();
  updateHeaderAuth();
  window.location.href = "index.html";
}

/** Returns the stored customer (doesn't re-fetch). */
function currentCustomer() { return getStoredCustomer(); }

/** True if the user has a token stored (may still be expired — server will reject). */
function isSignedIn() { return !!getToken(); }

// ─── Header state ─────────────────────────────────────────────────────────────

function updateHeaderAuth() {
  const customer = getStoredCustomer();
  const signInLink = document.querySelector(".header-signin");
  const userMenu   = document.querySelector(".header-user");
  const userName   = document.querySelector(".header-user-name");

  if (customer && isSignedIn()) {
    if (signInLink) signInLink.style.display = "none";
    if (userMenu)   userMenu.style.display = "flex";
    if (userName)   userName.textContent = customer.name.split(" ")[0]; // first name only
  } else {
    if (signInLink) signInLink.style.display = "";
    if (userMenu)   userMenu.style.display = "none";
  }
}

// ─── Utility: show an inline error in a form ─────────────────────────────────

function showAuthError(formId, message) {
  const el = document.getElementById(formId + "-error");
  if (el) { el.textContent = message; el.style.display = "block"; }
}

function clearAuthError(formId) {
  const el = document.getElementById(formId + "-error");
  if (el) { el.textContent = ""; el.style.display = "none"; }
}

// ─── Run on every page ───────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", updateHeaderAuth);
