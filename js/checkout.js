/**
 * js/checkout.js
 * - Logged-in users: pre-filled form, skip OTP
 * - Guest users: must verify email with OTP before payment
 */

/* globals window */

var _emailVerified = false; // tracks OTP state for guest users
var _verifiedEmail = "";
var _otpEmail = "";

// ── Pre-fill for logged-in users ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  var customer = typeof currentCustomer === "function" ? currentCustomer() : null;

  if (customer && typeof isSignedIn === "function" && isSignedIn()) {
    // Logged in — pre-fill and hide OTP button
    var parts = (customer.name || "").split(" ");
    var fn = document.getElementById("co-fname"); if (fn) fn.value = parts[0] || "";
    var ln = document.getElementById("co-lname"); if (ln) ln.value = parts.slice(1).join(" ") || "";
    var em = document.getElementById("co-email"); if (em) em.value = customer.email || "";
    var ph = document.getElementById("co-phone"); if (ph && customer.phone) ph.value = customer.phone;

    // Hide OTP UI — logged-in users don't need it
    var sendBtn = document.getElementById("send-otp-btn");
    if (sendBtn) sendBtn.style.display = "none";
    _emailVerified = true; // mark as verified
    var badge = document.getElementById("email-verified-badge");
    if (badge) { badge.textContent = "\u2713 Signed in as " + customer.email; badge.style.display = "block"; }
  } else {
    // Guest — wire up OTP buttons
    _initOtpFlow();
  }
});

function _initOtpFlow() {
  var sendBtn   = document.getElementById("send-otp-btn");
  var verifyBtn = document.getElementById("verify-otp-btn");
  var resendBtn = document.getElementById("resend-otp-btn");
  var otpBox    = document.getElementById("otp-box");
  var otpErr    = document.getElementById("otp-error");
  var badge     = document.getElementById("email-verified-badge");
  var emailEl   = document.getElementById("co-email");

  if (!sendBtn) return;

  function invalidateVerification() {
    _emailVerified = false;
    _verifiedEmail = "";
    if (badge) badge.style.display = "none";
    if (sendBtn) {
      sendBtn.style.display = "";
      sendBtn.textContent = "Verify email";
    }
  }

  if (emailEl) emailEl.addEventListener("input", function () {
    if (_verifiedEmail && emailEl.value.trim().toLowerCase() !== _verifiedEmail) {
      invalidateVerification();
    }
  });

  // Send OTP
  async function sendOtp() {
    var email = emailEl ? emailEl.value.trim() : "";
    if (!email || !emailEl || !emailEl.validity.valid) { showToast("Please enter a valid email address first."); return; }

    sendBtn.disabled = true; sendBtn.textContent = "Sending code…";
    try {
      var url = hubatorApiUrl("/api/public/auth/send-otp");
      if (!url) throw new Error("Store API URL is not configured.");
      var res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      var data = await res.json().catch(function() { return {}; });
      if (!res.ok) throw new Error(data.error || "Could not send OTP.");
      _otpEmail = email.toLowerCase();
      if (otpBox) otpBox.style.display = "block";
      if (otpErr) otpErr.style.display = "none";
      showToast("Code sent! Check your inbox.");
      sendBtn.textContent = "Resend code";
    } catch (err) {
      showToast(err.message);
      sendBtn.textContent = "Verify email";
    } finally {
      sendBtn.disabled = false;
    }
  }

  // Verify OTP
  async function verifyOtp() {
    var otpEl   = document.getElementById("otp-input");
    var email = emailEl ? emailEl.value.trim() : "";
    var otp   = otpEl   ? otpEl.value.trim()   : "";

    if (otp.length !== 6) { if (otpErr) { otpErr.textContent = "Please enter the 6-digit code."; otpErr.style.display = "block"; } return; }
    if (!_otpEmail || email.toLowerCase() !== _otpEmail) {
      if (otpErr) { otpErr.textContent = "Send a new code for this email address."; otpErr.style.display = "block"; }
      invalidateVerification();
      return;
    }

    if (verifyBtn) { verifyBtn.disabled = true; verifyBtn.textContent = "Verifying…"; }
    try {
      var url = hubatorApiUrl("/api/public/auth/verify-otp");
      if (!url) throw new Error("Store API URL not configured.");
      var res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      var data = await res.json().catch(function() { return {}; });
      if (!res.ok) {
        if (otpErr) { otpErr.textContent = data.error || "Wrong code."; otpErr.style.display = "block"; }
        if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.textContent = "Confirm"; }
        return;
      }
      // Verified!
      _emailVerified = true;
      _verifiedEmail = email.toLowerCase();
      if (otpBox) otpBox.style.display = "none";
      if (sendBtn) sendBtn.style.display = "none";
      if (badge)  { badge.style.display = "block"; }
      showToast("Email verified!");
    } catch (err) {
      if (otpErr) { otpErr.textContent = err.message; otpErr.style.display = "block"; }
      if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.textContent = "Confirm"; }
    }
  }

  sendBtn.addEventListener("click", sendOtp);
  if (verifyBtn) verifyBtn.addEventListener("click", verifyOtp);
  if (resendBtn) resendBtn.addEventListener("click", sendOtp);

  // Allow pressing Enter in OTP input
  var otpInput = document.getElementById("otp-input");
  if (otpInput) otpInput.addEventListener("keydown", function(e) { if (e.key === "Enter") { e.preventDefault(); verifyOtp(); } });
}

// ── Main checkout function ────────────────────────────────────────────────────
async function startCheckout(form) {
  var formError = document.getElementById("checkout-form-error");
  if (formError) { formError.textContent = ""; formError.style.display = "none"; }
  var lines = cartLines();
  if (!lines.length) { showToast("Your cart is empty"); return; }
  if (typeof cartHasUnavailableItems === "function" && cartHasUnavailableItems()) {
    showToast("Please remove unavailable items before checking out.");
    return;
  }

  if (form && typeof form.reportValidity === "function" && !form.reportValidity()) {
    showToast("Please complete the required checkout fields.");
    return;
  }

  // Block guests who haven't verified their email
  var isLoggedIn = typeof isSignedIn === "function" && isSignedIn();
  var emailField = document.getElementById("co-email");
  var checkoutEmail = emailField ? emailField.value.trim().toLowerCase() : "";
  if (!isLoggedIn && !_emailVerified) {
    if (!checkoutEmail) { showToast("Please enter your email address."); return; }
    showToast("Please verify your email address before paying.");
    var sendBtn = document.getElementById("send-otp-btn");
    if (sendBtn) { sendBtn.click(); }
    return;
  }
  if (!isLoggedIn && _verifiedEmail !== checkoutEmail) {
    _emailVerified = false;
    showToast("Please verify the email address used for this order.");
    return;
  }

  var btn = document.getElementById("pay-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Preparing payment…"; }

  function val(name) { var el = form.elements[name]; return el ? el.value.trim() : ""; }
  var snap = {
    firstName: val("firstName"), lastName:  val("lastName"),
    email:     val("email"),     phone:     val("phone"),
    address:   val("address"),   address2:  val("address2"),
    city:      val("city"),      state:     val("state"),
    postalCode:val("postalCode"),country:   val("country") || "India",
  };
  var fullName = (snap.firstName + " " + snap.lastName).trim();

  if (typeof window.Razorpay !== "function") {
    if (btn) { btn.disabled = false; btn.textContent = "Pay securely \u2192"; }
    throw new Error("Secure payment is unavailable right now. Please try again later.");
  }

  // Step 1: Create Razorpay order
  var rzpData;
  try {
    var url = hubatorApiUrl("/api/public/orders/razorpay-create");
    if (!url) throw new Error("Store API URL not configured.");
    var items = lines.map(function(l) {
      const variantKey = l.snapshot && l.snapshot.variantKey ? l.snapshot.variantKey : null;
      const product = l.product;
      const variant = variantKey && product.variants?.has
        ? product.variants.get(variantKey) || null
        : null;
      return { productId: l.product.id, quantity: l.qty, variantId: variant ? variant.sku : "" };
    });
    var res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    var text = await res.text();
    try { rzpData = JSON.parse(text); } catch(e) { rzpData = {}; }
    if (!res.ok) throw new Error(rzpData.error || ("Payment initiation failed (" + res.status + ")"));
    if (!rzpData.keyId || !rzpData.razorpayOrderId || !rzpData.amount) {
      throw new Error("Payment initiation returned an invalid response. Please try again.");
    }
  } catch(err) {
    if (btn) { btn.disabled = false; btn.textContent = "Pay securely \u2192"; }
    throw err;
  }

  // Step 2: Razorpay popup
  await new Promise(function(resolve, reject) {
    var rzp = new window.Razorpay({
      key: rzpData.keyId, amount: rzpData.amount, currency: rzpData.currency,
      order_id: rzpData.razorpayOrderId, name: "Hubator",
      description: lines.length + " item" + (lines.length > 1 ? "s" : ""),
      prefill: { name: fullName, email: snap.email, contact: snap.phone },
      theme: { color: "#C99A2E" },
      modal: { ondismiss: function() { if (btn) { btn.disabled = false; btn.textContent = "Pay securely \u2192"; } reject(new Error("Payment cancelled. You have not been charged.")); } },
      handler: async function(response) {
        try {
          var verifyUrl = hubatorApiUrl("/api/public/orders/razorpay-verify");
          if (!verifyUrl) throw new Error("Store API URL not configured.");
          var verifyRes = await fetch(verifyUrl, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customer: { name: fullName, email: snap.email, phone: snap.phone },
              shippingAddress: { name: fullName, line1: snap.address, line2: snap.address2 || undefined, city: snap.city, state: snap.state || snap.city, postalCode: snap.postalCode, country: snap.country, phone: snap.phone },
              items: lines.map(function(l) { return { productId: l.product.id, quantity: l.qty }; }),
              shippingMethod: "Standard",
            }),
          });
          var vtext = await verifyRes.text();
          var data = {}; try { data = JSON.parse(vtext); } catch(e) {}
          if (!verifyRes.ok) throw new Error(data.error || ("Order save failed. Contact support with payment ID: " + response.razorpay_payment_id));

          sessionStorage.setItem("hubator_last_order", JSON.stringify({
            orderNumber: data.orderNumber, email: snap.email,
            items: data.items || lines.map(function(l) { return { name: l.product.name, qty: l.qty, price: l.product.price }; }),
            subtotal: data.subtotal ?? rzpData.subtotal ?? cartSubtotal(), discountAmount: data.discountAmount || 0,
            shippingAmount: data.shippingAmount || 0, total: data.total ?? rzpData.total ?? cartSubtotal(),
            paymentMethod: "razorpay", paymentId: response.razorpay_payment_id,
            shippingAddress: data.shippingAddress || { line1: snap.address, line2: snap.address2, city: snap.city, state: snap.state, postalCode: snap.postalCode, country: snap.country },
          }));
          try { localStorage.removeItem(CART_KEY); } catch (e) { /* Confirmation can still proceed. */ }
          window.dispatchEvent(new CustomEvent("hubator:cart-changed"));

          // Do not make a successful paid order depend on account activation.
          await Promise.race([
            activateGuestAccount(fullName, snap.email, snap.phone),
            new Promise(function(resolve) { setTimeout(resolve, 1500); }),
          ]);
          window.location.href = "/order-confirmation";
          resolve();
        } catch(err) { reject(err); }
      },
    });
    rzp.on("payment.failed", function(resp) {
      if (btn) { btn.disabled = false; btn.textContent = "Pay securely \u2192"; }
      reject(new Error("Payment failed: " + ((resp.error && resp.error.description) || "Please try again.")));
    });
    rzp.open();
  });

  // ── Auto-create guest account after payment ──────────────────────────────────

  async function activateGuestAccount(name, email, phone) {
    if (typeof isSignedIn === "function" && isSignedIn()) return; // already signed in, skip
    try {
      const url = hubatorApiUrl("/api/public/auth/guest-activate");
      if (!url) return;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        // Save session — they are now signed in
        if (typeof saveSession === "function" && data.customer) {
          saveSession(data.token, data.customer);
        }
      }
    } catch (e) {
      // Silent fail — never block the order confirmation
      console.error("[guest-activate]", e);
    }
  }
}

// Checkout functions intentionally remain global for the checkout form template.