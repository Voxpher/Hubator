/**
 * Hubator checkout — Razorpay payment flow
 *
 * Flow:
 * 1. Customer submits the form → startCheckout() validates + calls razorpay-create
 * 2. Dashboard server creates a Razorpay order and returns the order_id + amount
 * 3. Razorpay popup opens → customer pays via UPI / card / net banking / wallet
 * 4. On success → razorpay-verify is called with the 3 Razorpay response tokens
 * 5. Dashboard verifies the HMAC signature server-side → creates the MongoDB order
 * 6. Cart is cleared and user sees a success message
 *
 * No secrets exist in this file. The secret key never leaves the dashboard server.
 */

async function startCheckout(form) {
  const lines = cartLines();
  if (!lines.length) { showToast("Your cart is empty"); return; }

  const btn = document.getElementById("pay-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Please wait…"; }

  const val = (name) => form.elements[name]?.value?.trim() ?? "";

  // ── Step 1: Ask the dashboard to create a Razorpay order ──────────────────
  let rzpData;
  try {
    const res = await fetch(hubatorApiUrl("/api/public/orders/razorpay-create"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
      }),
    });
    rzpData = await res.json();
    if (!res.ok) throw new Error(rzpData.error || "Could not initiate payment. Please try again.");
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = "Pay securely →"; }
    throw err;
  }

  // ── Step 2: Open Razorpay checkout popup ──────────────────────────────────
  await new Promise((resolve, reject) => {
    const options = {
      key: rzpData.keyId,
      amount: rzpData.amount,          // in paise
      currency: rzpData.currency,
      order_id: rzpData.razorpayOrderId,
      name: "Hubator",
      description: `Order — ${lines.length} item${lines.length > 1 ? "s" : ""}`,
      // No image needed — remove or add your logo URL here:
      // image: "https://your-logo-url.png",
      prefill: {
        name: `${val("firstName")} ${val("lastName")}`.trim(),
        email: val("email"),
        contact: val("phone"),
      },
      theme: { color: "#f59e0b" },  // matches Hubator gold colour
      modal: {
        ondismiss: () => {
          if (btn) { btn.disabled = false; btn.textContent = "Pay securely →"; }
          reject(new Error("Payment was cancelled. You have not been charged."));
        },
      },
      handler: async (response) => {
        // ── Step 3: Verify payment + create order in dashboard ───────────────
        try {
          const verifyRes = await fetch(hubatorApiUrl("/api/public/orders/razorpay-verify"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customer: {
                name: `${val("firstName")} ${val("lastName")}`.trim(),
                email: val("email"),
                phone: val("phone"),
              },
              shippingAddress: {
                name: `${val("firstName")} ${val("lastName")}`.trim(),
                line1: val("address"),
                line2: val("address2") || undefined,
                city: val("city"),
                state: val("state") || val("city"),
                postalCode: val("postalCode"),
                country: val("country"),
                phone: val("phone"),
              },
              items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
              shippingMethod: "Standard",
            }),
          });

          const data = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok) throw new Error(data.error || "Payment verified but order could not be saved. Please contact support with payment ID: " + response.razorpay_payment_id);

          // ── Step 4: Success ────────────────────────────────────────────────
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
    rzp.on("payment.failed", (response) => {
      if (btn) { btn.disabled = false; btn.textContent = "Pay securely →"; }
      reject(new Error("Payment failed: " + (response.error?.description || "Unknown error. Please try again.")));
    });
    rzp.open();
  });
}
