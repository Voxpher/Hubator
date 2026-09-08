/**
 * js/checkout.js
 * - Logged-in users: pre-filled form, skip OTP
 * - Guest users: must verify email with OTP before payment
 */

var _emailVerified = false; // tracks OTP state for guest users

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

  if (!sendBtn) return;

  // Send OTP
  async function sendOtp() {
    var emailEl = document.getElementById("co-email");
    var email = emailEl ? emailEl.value.trim() : "";
    if (!email || !email.includes("@")) { showToast("Please enter a valid email address first."); return; }

    sendBtn.disabled = true; sendBtn.textContent = "Sending...";
    try {
      var url = hubatorApiUrl("/api/public/auth/send-otp");
      var res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      var data = await res.json().catch(function() { return {}; });
      if (!res.ok) throw new Error(data.error || "Could not send OTP.");
      if (otpBox) otpBox.style.display = "block";
      if (otpErr) otpErr.style.display = "none";
      showToast("Code sent! Check your inbox.");
      sendBtn.textContent = "Resend code";
    } catch (err) {
      showToast(err.message);
    } finally {
      sendBtn.disabled = false;
    }
  }

  // Verify OTP
  async function verifyOtp() {
    var emailEl = document.getElementById("co-email");
    var otpEl   = document.getElementById("otp-input");
    var email = emailEl ? emailEl.value.trim() : "";
    var otp   = otpEl   ? otpEl.value.trim()   : "";

    if (otp.length !== 6) { if (otpErr) { otpErr.textContent = "Please enter the 6-digit code."; otpErr.style.display = "block"; } return; }

    if (verifyBtn) { verifyBtn.disabled = true; verifyBtn.textContent = "Checking..."; }
    try {
      var url = hubatorApiUrl("/api/public/auth/verify-otp");
      var res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      var data = await res.json().catch(function() { return {}; });
      if (!res.ok) {
        if (otpErr) { otpErr.textContent = data.error || "Wrong code."; otpErr.style.display = "block"; }
        if (verifyBtn) { verifyBtn.disabled = false; verifyBtn.textContent = "Confirm"; }
        return;
      }
      // Verified!
      _emailVerified = true;
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
  var lines = cartLines();
  if (!lines.length) { showToast("Your cart is empty"); return; }

  // Block guests who haven't verified their email
  var isLoggedIn = typeof isSignedIn === "function" && isSignedIn();
  if (!isLoggedIn && !_emailVerified) {
    var emailEl = document.getElementById("co-email");
    var email = emailEl ? emailEl.value.trim() : "";
    if (!email) { showToast("Please enter your email address."); return; }
    showToast("Please verify your email address before paying.");
    var sendBtn = document.getElementById("send-otp-btn");
    if (sendBtn) { sendBtn.click(); }
    return;
  }

  var btn = document.getElementById("pay-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Please wait..."; }

  function val(name) { var el = form.elements[name]; return el ? el.value.trim() : ""; }
  var snap = {
    firstName: val("firstName"), lastName:  val("lastName"),
    email:     val("email"),     phone:     val("phone"),
    address:   val("address"),   address2:  val("address2"),
    city:      val("city"),      state:     val("state"),
    postalCode:val("postalCode"),country:   val("country") || "India",
  };
  var fullName = (snap.firstName + " " + snap.lastName).trim();

  // Step 1: Create Razorpay order
  var rzpData;
  try {
    var url = hubatorApiUrl("/api/public/orders/razorpay-create");
    if (!url) throw new Error("Store API URL not configured.");
    var res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: lines.map(function(l) { return { productId: l.product.id, quantity: l.qty }; }) }) });
    var text = await res.text();
    try { rzpData = JSON.parse(text); } catch(e) { rzpData = {}; }
    if (!res.ok) throw new Error(rzpData.error || ("Payment initiation failed (" + res.status + ")"));
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
          var verifyRes = await fetch(hubatorApiUrl("/api/public/orders/razorpay-verify"), {
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

          // Auto-create/sign-in guest account after payment
          await activateGuestAccount(fullName, snap.email, snap.phone);

          sessionStorage.setItem("hubator_last_order", JSON.stringify({
            orderNumber: data.orderNumber, email: snap.email,
            items: data.items || lines.map(function(l) { return { name: l.product.name, qty: l.qty, price: l.product.price }; }),
            subtotal: data.subtotal || rzpData.subtotal, discountAmount: data.discountAmount || 0,
            shippingAmount: data.shippingAmount || 0, total: data.total,
            paymentMethod: "razorpay", paymentId: response.razorpay_payment_id,
            shippingAddress: data.shippingAddress || { line1: snap.address, line2: snap.address2, city: snap.city, state: snap.state, postalCode: snap.postalCode, country: snap.country },
          }));
          localStorage.removeItem(CART_KEY);
          window.location.href = "order-confirmation.html";
          resolve();
        } catch(err) { reject(err); }
      },
    });
    rzp.on("payment.failed", function(resp) {
      if (btn) { btn.disabled = false; btn.textContent = "Pay securely \u2192"; }
      reject(new Error("Payment failed: " + ((resp.error && resp.error.description) || "Please try again.")));
    });
    rzp.open();
  }

  // ── Auto-create guest account after payment ──────────────────────────────────

  async function activateGuestAccount(name, email, phone) {
    if (typeof isSignedIn === "function" && isSignedIn()) return; // already signed in, skip
    try {
      const res = await fetch(hubatorApiUrl("/api/public/auth/guest-activate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        // Save session — they are now signed in
        localStorage.setItem("hubator_token", data.token);
        localStorage.setItem("hubator_customer", JSON.stringify({
          id: data.customer.id,
          name: data.customer.name,
          email: data.customer.email
        }));
      }
    } catch (e) {
      // Silent fail — never block the order confirmation
      console.error("[guest-activate]", e);
    }
  }

})(window); // End of IIFE if any, or just close the module
