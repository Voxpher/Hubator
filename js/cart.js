/**
 * js/cart.js
 *
 * Cart storage: [{ id, qty, snapshot: { name, price, img, category, variantKey } }]
 */

var CART_KEY = "hubator_cart";

// ── Storage helpers ───────────────────────────────────────────────────────────

function getCart() {
  try {
    var cart = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(cart)) return [];
    return cart.map(function(line) {
      return {
        id: String(line && line.id != null ? line.id : ""),
        qty: Math.max(1, Math.min(99, Math.floor(Number(line && line.qty) || 0))),
        snapshot: line && line.snapshot && typeof line.snapshot === "object"
          ? {
              name: String(line.snapshot.name || "Product"),
              price: Math.max(0, Number(line.snapshot.price) || 0),
              img: typeof line.snapshot.img === "string" ? line.snapshot.img : "",
              category: String(line.snapshot.category || ""),
              variantKey: line.snapshot.variantKey || null,
            }
          : null,
      };
    }).filter(function(line) { return line.id && line.qty > 0; });
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  var normalized = cart.filter(function(line) { return line && line.id != null; }).map(function(line) {
    return {
      id: String(line.id),
      qty: Math.max(1, Math.min(99, Math.floor(Number(line.qty) || 1))),
      snapshot: line.snapshot || null,
    };
  });
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  } catch (e) {
    showToast("Unable to save your cart in this browser.");
    return false;
  }
  updateCartBadge();
  window.dispatchEvent(new CustomEvent("hubator:cart-changed", { detail: normalized }));
  return true;
}

// ── Mutation ──────────────────────────────────────────────────────────────────

function addToCart(id, qty, variantKey) {
  qty = qty || 1;
  variantKey = variantKey || null;
  var productId = String(id);
  var live = typeof getProductById === "function" ? getProductById(productId) : null;
  if (live && typeof productIsPurchasable === "function" && !productIsPurchasable(live)) {
    showToast("This product is currently out of stock.");
    return false;
  }

  var amount = Math.max(1, Math.floor(Number(qty) || 1));
  var cart = getCart();
  var item = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === productId) { item = cart[i]; break; }
  }

  var snapshot = null;
  if (live) {
    var variantPrice = live.price;
    if (variantKey && live.variants && typeof live.variants.get === "function") {
      var variant = live.variants.get(variantKey);
      if (variant && variant.priceOverride != null) variantPrice = Number(variant.priceOverride);
    }
    snapshot = { name: live.name, price: variantPrice, img: live.img || "", category: live.category, variantKey: variantKey };
  }

  if (item) {
    item.qty += amount;
    if (live && live.lowestVariantStock != null) {
      item.qty = Math.min(item.qty, Math.max(1, live.lowestVariantStock));
    }
    if (snapshot) item.snapshot = snapshot;
  } else {
    cart.push({ id: productId, qty: amount, snapshot: snapshot });
  }

  if (!saveCart(cart)) return false;
  showToast("Added to cart");
  return true;
}

function removeFromCart(id) {
  saveCart(getCart().filter(function(line) { return line.id !== String(id); }));
}

function setQty(id, qty, variantKey) {
  var cart = getCart();
  var item = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === String(id)) { item = cart[i]; break; }
  }
  if (!item) return;
  var live = typeof getProductById === "function" ? getProductById(id) : null;
  var max = live && live.lowestVariantStock != null ? Math.max(1, live.lowestVariantStock) : 99;
  item.qty = Math.max(1, Math.min(max, Math.floor(Number(qty) || 1)));
  if (item.snapshot && variantKey !== undefined) {
    item.snapshot.variantKey = variantKey;
  }
  saveCart(cart);
}

// ── Read helpers ──────────────────────────────────────────────────────────────

function cartCount() {
  return getCart().reduce(function(total, line) { return total + line.qty; }, 0);
}

function cartLines() {
  return getCart().map(function(line) {
    var live = typeof getProductById === "function" ? getProductById(line.id) : null;
    var variantKey = line.snapshot && line.snapshot.variantKey ? line.snapshot.variantKey : null;
    var product;
    if (live) {
      product = live;
    } else if (line.snapshot) {
      product = {
        id: line.id,
        name: line.snapshot.name || "Product",
        price: line.snapshot.price || 0,
        img: line.snapshot.img || "",
        category: line.snapshot.category || "",
        variants: new Map(),
        lowestVariantStock: null,
      };
    } else {
      return null;
    }
    var variant = null;
    if (variantKey && product.variants && typeof product.variants.get === "function") {
      variant = product.variants.get(variantKey) || null;
    }
    return { id: line.id, qty: line.qty, snapshot: line.snapshot, product: product, variant: variant, variantKey: variantKey };
  }).filter(Boolean);
}

function cartHasUnavailableItems() {
  return cartLines().some(function(line) {
    if (line.variantKey && line.variant && line.variant.stock != null) {
      return line.variant.stock < line.qty;
    }
    return line.product.stock != null && line.product.stock < line.qty;
  });
}

function cartSubtotal() {
  return cartLines().reduce(function(total, line) {
    var price = line.variant && line.variant.priceOverride != null
      ? Number(line.variant.priceOverride)
      : line.product.price;
    return total + price * line.qty;
  }, 0);
}

// ── Refresh snapshots when live products load ─────────────────────────────────

window.addEventListener("hubator:products-loaded", function() {
  var cart = getCart();
  var updated = false;
  cart.forEach(function(line) {
    var live = typeof getProductById === "function" ? getProductById(line.id) : null;
    if (live) {
      var existingVariantKey = line.snapshot ? line.snapshot.variantKey : null;
      line.snapshot = { name: live.name, price: live.price, img: live.img, category: live.category, variantKey: existingVariantKey };
      updated = true;
    }
  });
  if (updated) saveCart(cart);
});

// ── UI ────────────────────────────────────────────────────────────────────────

function updateCartBadge() {
  var count = cartCount();
  document.querySelectorAll(".cart-count").forEach(function(el) {
    el.textContent = count;
    var link = el.closest("a");
    if (link) link.setAttribute("aria-label", "Cart, " + count + " item" + (count === 1 ? "" : "s"));
  });
}

function ensureToast() {
  var toast = document.querySelector(".toast");
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
  var toast = ensureToast();
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function() { toast.classList.remove("show"); }, 2200);
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

window.addEventListener("storage", function(event) {
  if (event.key === CART_KEY || event.key === null) {
    updateCartBadge();
    window.dispatchEvent(new CustomEvent("hubator:cart-changed"));
  }
});
