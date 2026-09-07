/**
 * js/checkout.js
 * Works for both guest and logged-in users -- no account required to purchase.
 * Logged-in users get their details pre-filled.
 */

// Pre-fill form fields for logged-in users
document.addEventListener("DOMContentLoaded", function () {
  var customer = typeof currentCustomer === "function" ? currentCustomer() : null;
  if (!customer) return;
  // Pre-fill name
  if (customer.name) {
    var parts = customer.name.split(" ");
    var fn = document.getElementById("co-fname");
    var ln = document.getElementById("co-lname");
    if (fn) fn.value = parts[0] || "";
    if (ln) ln.value = parts.slice(1).join(" ") || "";
  }
  var emailEl = document.getElementById("co-email");
  if (emailEl && customer.email) emailEl.value = customer.email;
  // Phone if stored
  if (customer.phone) {
    var phoneEl = document.getElementById("co-phone");
    if (phoneEl) phoneEl.value = customer.phone;
  }
});

async function startCheckout(form) {
  var lines = cartLines();
  if (!lines.length) { showToast("Your cart is empty"); return; }

  var btn = document.getElementById("pay-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Please wait..."; }

  // Snapshot ALL form values before popup opens (prevents race condition)
  function val(name) {
    var el = form.elements[name];
    return el ? el.value.trim() : "";
  }
  var snap = {
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
  var fullName = (snap.firstName + " " + snap.lastName).trim();

  // Step 1: Create Razorpay order server-side
  var rzpData;
  try {
    var url = hubatorApiUrl("/api/public/orders/razorpay-create");
    if (!url) throw new Error("Store API URL not configured.");
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map(function(l) { return { productId: l.product.id, quantity: l.qty }; }) }),
    });
    var text = await res.text();
    try { rzpData = JSON.parse(text); } catch(e) { rzpData = {}; }
    if (!res.ok) throw new Error(rzpData.error || ("Payment initiation failed (" + res.status + ")"));
  } catch(err) {
    if (btn) { btn.disabled = false; btn.textContent = "Pay securely \u2192"; }
    throw err;
  }

  // Step 2: Open Razorpay popup
  await new Promise(function(resolve, reject) {
    var options = {
      key:      rzpData.keyId,
      amount:   rzpData.amount,
      currency: rzpData.currency,
      order_id: rzpData.razorpayOrderId,
      name:     "Hubator",
      description: lines.length + " item" + (lines.length > 1 ? "s" : ""),
      prefill: { name: fullName, email: snap.email, contact: snap.phone },
      theme: { color: "#C99A2E" },
      modal: {
        ondismiss: function() {
          if (btn) { btn.disabled = false; btn.textContent = "Pay securely \u2192"; }
          reject(new Error("Payment was cancelled. You have not been charged."));
        },
      },
      handler: async function(response) {
        // Step 3: Verify payment + create MongoDB order
        try {
          var verifyUrl = hubatorApiUrl("/api/public/orders/razorpay-verify");
          var verifyRes = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              customer: { name: fullName, email: snap.email, phone: snap.phone },
              shippingAddress: {
                name:       fullName,
                line1:      snap.address,
                line2:      snap.address2 || undefined,
                city:       snap.city,
                state:      snap.state || snap.city,
                postalCode: snap.postalCode,
                country:    snap.country,
                phone:      snap.phone,
              },
              items: lines.map(function(l) { return { productId: l.product.id, quantity: l.qty }; }),
              shippingMethod: "Standard",
            }),
          });
          var vtext = await verifyRes.text();
          var data = {};
          try { data = JSON.parse(vtext); } catch(e) {}

          if (!verifyRes.ok) {
            throw new Error(data.error || ("Order save failed (" + verifyRes.status + "). Payment went through -- contact support with ID: " + response.razorpay_payment_id));
          }

          // Save order details for confirmation page
          sessionStorage.setItem("hubator_last_order", JSON.stringify({
            orderNumber:     data.orderNumber,
            email:           snap.email,
            items:           data.items || lines.map(function(l) { return { name: l.product.name, qty: l.qty, price: l.product.price }; }),
            subtotal:        data.subtotal || rzpData.subtotal,
            discountAmount:  data.discountAmount || 0,
            shippingAmount:  data.shippingAmount || 0,
            total:           data.total,
            paymentMethod:   "razorpay",
            paymentId:       response.razorpay_payment_id,
            shippingAddress: data.shippingAddress || { line1: snap.address, line2: snap.address2, city: snap.city, state: snap.state, postalCode: snap.postalCode, country: snap.country },
          }));

          localStorage.removeItem(CART_KEY);
          window.location.href = "order-confirmation.html";
          resolve();
        } catch(err) {
          reject(err);
        }
      },
    };

    var rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function(resp) {
      if (btn) { btn.disabled = false; btn.textContent = "Pay securely \u2192"; }
      reject(new Error("Payment failed: " + ((resp.error && resp.error.description) || "Please try again.")));
    });
    rzp.open();
  });
}
