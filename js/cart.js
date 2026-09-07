const CART_KEY = "hubator_cart";

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  const item = cart.find((line) => line.id === String(id));

  if (item) item.qty += qty;
  else cart.push({ id: String(id), qty });

  saveCart(cart);
  showToast("Added to cart");
}

function removeFromCart(id) {
  saveCart(getCart().filter((line) => line.id !== String(id)));
}

function setQty(id, qty) {
  const cart = getCart();
  const item = cart.find((line) => line.id === String(id));
  if (!item) return;

  item.qty = Math.max(1, qty);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((total, line) => total + line.qty, 0);
}

function cartLines() {
  return getCart()
    .map((line) => ({
      ...line,
      product: getProductById(line.id),
    }))
    .filter((line) => line.product);
}

function cartSubtotal() {
  return cartLines().reduce(
    (total, line) => total + line.product.price * line.qty,
    0
  );
}

function updateCartBadge() {
  const count = cartCount();

  document.querySelectorAll(".cart-count").forEach((element) => {
    element.textContent = count;

    const link = element.closest("a");
    if (link) {
      link.setAttribute(
        "aria-label",
        "Cart, " + count + " item" + (count === 1 ? "" : "s")
      );
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
  } else {
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
  }

  return toast;
}

function showToast(message) {
  const toast = ensureToast();
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function initializeCartUI() {
  updateCartBadge();
  ensureToast();

  // Mobile navigation is managed exclusively by js/layout.js.
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCartUI, { once: true });
} else {
  initializeCartUI();
}

window.addEventListener("storage", (event) => {
  if (event.key === CART_KEY || event.key === null) {
    updateCartBadge();
  }
});
