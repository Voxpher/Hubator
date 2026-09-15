/**
 * js/cart.js
 *
 * Cart storage: [{ id, qty, snapshot: { name, price, img, category, variantId, color, size } }]
 * Lines are keyed by productId + variantId, so the same product in two
 * colours or sizes lives in the cart as two separate lines.
 */

var CART_KEY = "hubator_cart";

function cartLineKey(id, variantId) {
  return String(id || "") + "::" + String(variantId || "");
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function getCart() {
  try {
    var cart = JSON.parse(localStorage.getItem(CART_KEY));
    if (!Array.isArray(cart)) return [];
    return cart.map(function(line) {
      var snapshot = line && line.snapshot && typeof line.snapshot === "object"
        ? {
            name: String(line.snapshot.name || "Product"),
            price: Math.max(0, Number(line.snapshot.price) || 0),
            img: typeof line.snapshot.img === "string" ? line.snapshot.img : "",
            category: String(line.snapshot.category || ""),
            variantId: line.snapshot.variantId != null ? String(line.snapshot.variantId) : "",
            color: line.snapshot.color != null ? String(line.snapshot.color) : "",
            size: line.snapshot.size != null ? String(line.snapshot.size) : "",
          }
        : null;
      // Legacy carts stored a display-only "color-size" variantKey without a server id.
      if (snapshot && !snapshot.variantId && line.snapshot && typeof line.snapshot.variantKey === "string" && line.snapshot.variantKey) {
        var legacyParts = line.snapshot.variantKey.split("-");
        if (legacyParts.length > 1) {
          snapshot.color = legacyParts[0];
          snapshot.size = legacyParts.slice(1).join("-");
        }
      }
      return {
        id: String(line && line.id != null ? line.id : ""),
        qty: Math.max(1, Math.min(99, Math.floor(Number(line && line.qty) || 0))),
        snapshot: snapshot,
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

function variantOfProduct(product, variantId) {
  if (!product || !variantId || !product.variants || typeof product.variants.forEach !== "function") return null;
  var wanted = String(variantId);
  var found = null;
  product.variants.forEach(function(v) {
    if (!found && v && String(v._id || "") === wanted) found = v;
  });
  return found;
}

function variantPriceOf(product, variant) {
  return variant && variant.priceOverride != null ? Number(variant.priceOverride) : product.price;
}

function addToCart(id, qty, variantId) {
  qty = qty || 1;
  variantId = variantId ? String(variantId) : "";
  var productId = String(id);
  var live = typeof getProductById === "function" ? getProductById(productId) : null;
  if (live && typeof productIsPurchasable === "function" && !productIsPurchasable(live)) {
    showToast("This product is currently out of stock.");
    return false;
  }
  var variant = variantOfProduct(live, variantId);
  if (variantId && !variant) {
    showToast("Please choose an available option first.");
    return false;
  }

  var amount = Math.max(1, Math.floor(Number(qty) || 1));
  var cart = getCart();
  var lineKey = cartLineKey(productId, variantId);
  var item = null;
  for (var i = 0; i < cart.length; i++) {
    if (cartLineKey(cart[i].id, cart[i].snapshot && cart[i].snapshot.variantId) === lineKey) { item = cart[i]; break; }
  }

  var snapshot = null;
  if (live) {
    snapshot = {
      name: live.name,
      price: variantPriceOf(live, variant),
      img: live.img || "",
      category: live.category,
      variantId: variant ? String(variant._id || "") : "",
      color: variant && variant.color ? variant.color : "",
      size: variant && variant.size ? variant.size : "",
    };
  }

  if (item) {
    item.qty += amount;
    if (variant && variant.stock != null) {
      if (variant.stock < 1) {
        showToast("Sorry, this option is out of stock.");
        return false;
      }
      item.qty = Math.min(item.qty, variant.stock);
    } else if (live && live.lowestVariantStock != null) {
      item.qty = Math.min(item.qty, Math.max(1, live.lowestVariantStock));
    }
    if (snapshot) item.snapshot = snapshot;
  } else {
    if (variant && variant.stock != null && variant.stock < 1) {
      showToast("Sorry, this option is out of stock.");
      return false;
    }
    cart.push({ id: productId, qty: amount, snapshot: snapshot });
  }

  if (!saveCart(cart)) return false;
  showToast("Added to cart");
  return true;
}

function removeFromCart(id, variantId) {
  var lineKey = cartLineKey(id, variantId);
  saveCart(getCart().filter(function(line) {
    return cartLineKey(line.id, line.snapshot && line.snapshot.variantId) !== lineKey;
  }));
}

function setQty(id, qty, variantId) {
  var lineKey = cartLineKey(id, variantId);
  var cart = getCart();
  var item = null;
  for (var i = 0; i < cart.length; i++) {
    if (cartLineKey(cart[i].id, cart[i].snapshot && cart[i].snapshot.variantId) === lineKey) { item = cart[i]; break; }
  }
  if (!item) return;
  var live = typeof getProductById === "function" ? getProductById(id) : null;
  var variant = variantOfProduct(live, item.snapshot && item.snapshot.variantId);
  var max = variant && variant.stock != null
    ? Math.max(0, variant.stock)
    : (live && live.lowestVariantStock != null ? Math.max(1, live.lowestVariantStock) : 99);
  var next = Math.min(max, Math.floor(Number(qty) || 1));
  if (next < 1) {
    saveCart(cart.filter(function(line) { return line !== item; }));
    return;
  }
  item.qty = next;
  saveCart(cart);
}

// ── Read helpers ──────────────────────────────────────────────────────────────

function cartCount() {
  return getCart().reduce(function(total, line) { return total + line.qty; }, 0);
}

function cartLines() {
  return getCart().map(function(line) {
    var live = typeof getProductById === "function" ? getProductById(line.id) : null;
    var variantId = line.snapshot && line.snapshot.variantId ? String(line.snapshot.variantId) : "";
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
    var variant = variantOfProduct(product, variantId);
    return {
      id: line.id,
      qty: line.qty,
      snapshot: line.snapshot,
      product: product,
      variant: variant,
      variantId: variantId,
      color: (line.snapshot && line.snapshot.color) || (variant && variant.color) || "",
      size: (line.snapshot && line.snapshot.size) || (variant && variant.size) || "",
    };
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
      var variant = variantOfProduct(live, line.snapshot && line.snapshot.variantId);
      line.snapshot = {
        name: live.name,
        price: variantPriceOf(live, variant),
        img: live.img,
        category: live.category,
        variantId: variant ? String(variant._id || "") : "",
        color: variant && variant.color ? variant.color : "",
        size: variant && variant.size ? variant.size : "",
      };
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
