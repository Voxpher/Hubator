/**
 * js/checkout.js — Razorpay payment flow.
 * No secrets here. Secret key stays on the dashboard server.
 *
 * Flow:
 * 1. Snapshot form values before opening popup (race-condition fix)
 * 2. POST razorpay-create → get Razorpay order_id + amount
 * 3. Open Razorpay popup → customer pays
 * 4. POST razorpay-verify with HMAC tokens → MongoDB order created
 * 5. Clear cart, show confirmation
 */

async function startCheckout(form) {
  const lines = cartLines();
  if (!lines.length) { showToast("Your cart is empty"); return; }

  const btn = document.getElementById("pay-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Please wait…"; }

  // Snapshot ALL form values BEFORE the popup opens
  // (prevents race condition if user edits fields during payment)
  const val = (name) => {
    const el = form.elements[name];
    return el ? el.value.trim() : "";
  };
  const snapshot = {
    firstName:  val("firstName"),
    lastName:   val("lastName"),
    email:      val("email"),
    phone:      val("phone"),
    address:    val("address"),
    address2:   val("address2"),
    city:       val("city"),
    state:      val("state"),
    postalCode: val("postalCode"),
    country:    val("country") || "India",
  };

  const fullName = `${snapshot.firstName} ${snapshot.lastName}`.trim();

  // ── Step 1: Create Razorpay order server-side ─────────────────────────────
  let rzpData;
  try {
    const url = hubatorApiUrl("/api/public/orders/razorpay-create");
    if (!url) throw new Error("Store API URL not configured.");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
      }),
    });
    const text = await res.text();
    try { rzpData = JSON.parse(text); } catch { rzpData = {}; }
    if (!res.ok) throw new Error(rzpData.error || `Payment initiation failed (${res.status})`);
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = "Pay securely →"; }
    throw err;
  }

  // ── Step 2: Open Razorpay popup ───────────────────────────────────────────
  await new Promise((resolve, reject) => {
    const options = {
      key:      rzpData.keyId,
      amount:   rzpData.amount,
      currency: rzpData.currency,
      order_id: rzpData.razorpayOrderId,
      name:     "Hubator",
      description: `${lines.length} item${lines.length > 1 ? "s" : ""}`,
      prefill: { name: fullName, email: snapshot.email, contact: snapshot.phone },
      theme: { color: "#C99A2E" },
      modal: {
        ondismiss: () => {
          if (btn) { btn.disabled = false; btn.textContent = "Pay securely →"; }
          reject(new Error("Payment was cancelled. You have not been charged."));
        },
      },
      handler: async (response) => {
        // ── Step 3: Verify + create order ────────────────────────────────────
        try {
          const verifyUrl = hubatorApiUrl("/api/public/orders/razorpay-verify");
          const verifyRes = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id:  response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customer: { name: fullName, email: snapshot.email, phone: snapshot.phone },
              shippingAddress: {
                name:       fullName,
                line1:      snapshot.address,
                line2:      snapshot.address2 || undefined,
                city:       snapshot.city,
                state:      snapshot.state || snapshot.city,
                postalCode: snapshot.postalCode,
                country:    snapshot.country,
                phone:      snapshot.phone,
              },
              items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
              shippingMethod: "Standard",
            }),
          });

          const text = await verifyRes.text();
          let data = {};
          try { data = JSON.parse(text); } catch { /* non-JSON response */ }

          if (!verifyRes.ok) {
            throw new Error(
              data.error ||
              `Order save failed (${verifyRes.status}). Your payment went through — please contact support with payment ID: ${response.razorpay_payment_id}`
            );
          }

          // ── Success ───────────────────────────────────────────────────────
          localStorage.removeItem(CART_KEY);
          showToast(`✅ Order ${data.orderNumber} confirmed! Thank you.`);
          setTimeout(() => { window.location.href = "index.html"; }, 2000);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      if (btn) { btn.disabled = false; btn.textContent = "Pay securely →"; }
      reject(new Error("Payment failed: " + (resp.error?.description || "Please try again.")));
    });
    rzp.open();
  });
}
