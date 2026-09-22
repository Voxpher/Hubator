/**
 * js/discount.js
 *
 * Discount-code state for the storefront cart + checkout.
 *
 * The applied code is stored in localStorage. The discount itself is always
 * validated server-side via POST /api/public/discount/validate — the preview
 * shown here is cosmetic; the amount actually charged is recomputed by the
 * API when the Razorpay order is created and verified.
 */

var DISCOUNT_KEY = "hubator_discount_code";

function getAppliedDiscountCode() {
  try {
    return (localStorage.getItem(DISCOUNT_KEY) || "").trim().toUpperCase() || "";
  } catch (e) {
    return "";
  }
}

function setAppliedDiscountCode(code) {
  try {
    localStorage.setItem(DISCOUNT_KEY, String(code || "").trim().toUpperCase());
  } catch (e) { /* storage unavailable — code simply won't persist */ }
  window.dispatchEvent(new CustomEvent("hubator:discount-changed"));
}

function clearAppliedDiscountCode() {
  try {
    localStorage.removeItem(DISCOUNT_KEY);
  } catch (e) { /* ignore */ }
  window.dispatchEvent(new CustomEvent("hubator:discount-changed"));
}

/**
 * Validate the currently applied code against the current cart.
 * Resolves to:
 *   { valid: true, code, type, discountAmount, freeShipping, summary }
 *   { valid: false, code, reason }
 */
function validateAppliedDiscount() {
  var code = getAppliedDiscountCode();
  if (!code) return Promise.resolve({ valid: false, code: "", reason: "" });

  var url = typeof hubatorApiUrl === "function" ? hubatorApiUrl("/api/public/discount/validate") : null;
  if (!url) return Promise.resolve({ valid: false, code: code, reason: "Store API is not configured." });

  var lines = typeof cartLines === "function" ? cartLines() : [];
  var items = lines.map(function (l) {
    var item = { productId: l.product.id, quantity: l.qty };
    if (l.variantId) item.variantId = l.variantId;
    return item;
  });
  if (!items.length) return Promise.resolve({ valid: false, code: code, reason: "Your cart is empty." });

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code, items: items }),
  })
    .then(function (res) {
      return res.json().catch(function () { return {}; });
    })
    .then(function (data) {
      if (!data || data.valid !== true) {
        return { valid: false, code: code, reason: (data && data.reason) || "This code is not valid." };
      }
      return {
        valid: true,
        code: data.code || code,
        type: data.type,
        discountAmount: Number(data.discountAmount) || 0,
        freeShipping: !!data.freeShipping,
        summary: data.summary || "Discount applied",
      };
    })
    .catch(function () {
      return { valid: false, code: code, reason: "Could not check the code. Please try again." };
    });
}
