/**
 * js/cart.js
 *
 * Cart storage format: [{ id, qty, snapshot: { name, price, img, category } }]
 *
 * The snapshot ensures cart items always display correctly — even before
 * window.PRODUCTS has finished loading from the API. Once products load,
 * live data is used instead. This permanently fixes the "cart goes empty"
 * bug caused by the race condition between page load and API response.
 */

const CART_KEY = "hubator_cart";

// ── Storage helpers ───────────────────────────────────────────────────────────

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(cart)) return [];
    return cart
      .map((line) => ({
        id: String(line && line.id != null ? line.id : ""),
        qty: Math.max(1, Math.min(99, Math.floor(Number(line && line.qty) || 0))),
        snapshot: line && line.snapshot && typeof line.snapshot === "object"
          ? {
              name: String(line.snapshot.name || "Product"),
              price: Math.max(0, Number(line.snapshot.price) || 0),
              img: typeof line.snapshot.img === "string" ? line.snapshot.img : "",
              category: String(line.snapshot.category || ""),
            }
          : null,
      }))
      .filter((line) => line.id && line.qty > 0);
  } catch {
    return [];
  }
}

function saveCart(cart) {
  const normalized = cart
    .filter((line) => line && line.id != null)
    .map((line) => ({
      id: String(line.id),
      qty: Math.max(1, Math.min(99, Math.floor(Number(line.qty) || 1))),
      snapshot: line.snapshot || null,
    }));
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  } catch {
    showToast("Unable to save your cart in this browser.");
    return false;
  }
  updateCartBadge();
  window.dispatchEvent(new CustomEvent("hubator:cart-changed", { detail: normalized }));
  return true;
}

// ── Mutation ──────────────────────────────────────────────────────────────────

function addToCart(id, qty = 1) {
  const productId = String(id);
  const live = typeof getProductById === "function" ? getProductById(productId) : null;
  if (live && typeof productIsPurchasable === "function" && !productIsPurchasable(live)) {
    showToast("This product is currently out of stock.");
    return false;
  }

  const amount = Math.max(1, Math.floor(Number(qty) || 1));
  const cart = getCart();
  const item = cart.find((line) => line.id === productId);

  // Capture a snapshot from live product data if available
  const snapshot = live ? { name: live.name, price: live.price, img: live.img, category: live.category } : null;

  if (item) {
    item.qty += amount;
    if (live && live.stock != null) item.qty = Math.min(item.qty, Math.max(1, live.stock));
    if (snapshot) item.snapshot = snapshot; // refresh snapshot
  } else {
    cart.push({ id: productId, qty: live && live.stock != null ? Math.min(amount, Math.max(1, live.stock)) : amount, snapshot });
  }

  if (!saveCart(cart)) return false;
  showToast("Added to cart");
  return true;
}

function removeFromCart(id) {
  saveCart(getCart().filter((line) => line.id !== String(id)));
}

function setQty(id, qty) {
  const cart = getCart();
  const item = cart.find((line) => line.id === String(id));
  if (!item) return;
  const live = typeof getProductById === "function" ? getProductById(id) : null;
  const max = live && live.stock != null ? Math.max(1, live.stock) : 99;
  item.qty = Math.max(1, Math.min(max, Math.floor(Number(qty) || 1)));
  saveCart(cart);
}

// ── Read helpers ──────────────────────────────────────────────────────────────

function cartCount() {
  return getCart().reduce((total, line) => total + line.qty, 0);
}

/**
 * Returns cart lines with product data.
 * Uses live product data when available, falls back to stored snapshot.
 * This means the cart NEVER shows as empty just because products haven't loaded yet.
 */
function cartLines() {
  return getCart()
    .map((line) => {
      const live = typeof getProductById === "function" ? getProductById(line.id) : null;
      const product = live || (line.snapshot ? {
        id: line.id,
        name: line.snapshot.name || "Product",
        price: line.snapshot.price || 0,
        img: line.snapshot.img || "",
        category: line.snapshot.category || "",
      } : null);
      return product ? { ...line, product } : null;
    })
    .filter(Boolean);
}

function cartHasUnavailableItems() {
  return cartLines().some((line) => (
    line.product.stock != null && line.product.stock < line.qty
  ));
}

function cartSubtotal() {
  return cartLines().reduce((total, line) => total + line.product.price * line.qty, 0);
}

// ── When live products load, refresh snapshots in cart ────────────────────────

window.addEventListener("hubator:products-loaded", function () {
  const cart = getCart();
  let updated = false;
  cart.forEach((line) => {
    const live = typeof getProductById === "function" ? getProductById(line.id) : null;
    if (live) {
      line.snapshot = { name: live.name, price: live.price, img: live.img, category: live.category };
      updated = true;
    }
  });
  if (updated) saveCart(cart);
});

// ── UI ────────────────────────────────────────────────────────────────────────

function updateCartBadge() {
  const count = cartCount();
  document.querySelectorAll(".cart-count").forEach((element) => {
    element.textContent = count;
    const link = element.closest("a");
    if (link) {
      link.setAttribute("aria-label", "Cart, " + count + " item" + (count === 1 ? "" : "s"));
    }
  });
}

function ensureToast() {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    document.body.appendChild(toast);
  }
  return toast;
}

function showToast(message) {
  const toast = ensureToast();
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { toast.classList.remove("show"); }, 2200);
}

function initializeCartUI() {
  updateCartBadge();
  ensureToast();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCartUI, { once: true });
} else {
  initializeCartUI();
}

// Sync cart badge across tabs
window.addEventListener("storage", (event) => {
  if (event.key === CART_KEY || event.key === null) {
    updateCartBadge();
    window.dispatchEvent(new CustomEvent("hubator:cart-changed"));
  }
});
