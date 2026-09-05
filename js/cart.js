const CART_KEY = "hubator_cart";
function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }
function addToCart(id, qty = 1) { const cart = getCart(); const item = cart.find((line) => line.id === String(id)); if (item) item.qty += qty; else cart.push({ id: String(id), qty }); saveCart(cart); showToast("Added to cart"); }
function removeFromCart(id) { saveCart(getCart().filter((line) => line.id !== String(id))); }
function setQty(id, qty) { const cart = getCart(); const item = cart.find((line) => line.id === String(id)); if (!item) return; item.qty = Math.max(1, qty); saveCart(cart); }
function cartCount() { return getCart().reduce((total, line) => total + line.qty, 0); }
function cartLines() { return getCart().map((line) => ({ ...line, product: getProductById(line.id) })).filter((line) => line.product); }
function cartSubtotal() { return cartLines().reduce((total, line) => total + line.product.price * line.qty, 0); }
function updateCartBadge() { document.querySelectorAll(".cart-count").forEach((el) => { el.textContent = cartCount(); }); }
function showToast(message) { let toast = document.querySelector(".toast"); if (!toast) { toast = document.createElement("div"); toast.className = "toast"; document.body.appendChild(toast); } toast.textContent = message; toast.classList.add("show"); clearTimeout(window._toastTimer); window._toastTimer = setTimeout(() => toast.classList.remove("show"), 2200); }
document.addEventListener("DOMContentLoaded", () => { updateCartBadge(); const toggle = document.querySelector(".nav-toggle"); const nav = document.querySelector(".main-nav"); if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open")); });
