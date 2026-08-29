/* =========================================================
   PAYMENT INTEGRATION POINT
   -----------------------------------------------------------
   This is a static site (no server), so it cannot securely
   charge cards on its own. Pick ONE of these two options:

   OPTION A — Stripe Payment Link (no code, fastest)
   1. In your Stripe Dashboard: Payment Links > Create.
   2. Add your products/prices, save, copy the link URL.
   3. Paste it below as STRIPE_PAYMENT_LINK.
   This redirects the customer to a Stripe-hosted checkout —
   Stripe handles card storage/PCI compliance for you.

   OPTION B — Stripe Checkout Session (custom line items,
   needs a tiny backend/serverless function)
   1. Deploy a small function (Vercel/Netlify/Supabase Edge
      Function) that takes the cart and calls
      stripe.checkout.sessions.create(...) with your SECRET
      key (never put the secret key in this front-end code).
   2. Set STRIPE_SESSION_ENDPOINT below to that function's URL.
   3. This file will POST the cart to it and redirect to the
      returned session URL.
   ========================================================= */

const STRIPE_PAYMENT_LINK = ""; // e.g. "https://buy.stripe.com/xxxxxxxx"
const STRIPE_SESSION_ENDPOINT = ""; // e.g. "https://yourapi.com/create-checkout-session"

async function startCheckout(){
  const lines = cartLines();
  if(lines.length === 0){
    showToast("Your cart is empty");
    return;
  }

  if(STRIPE_SESSION_ENDPOINT){
    try{
      const res = await fetch(STRIPE_SESSION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines.map(l => ({ id: l.product.id, qty: l.qty })) })
      });
      const data = await res.json();
      if(data.url){ window.location.href = data.url; return; }
    }catch(err){
      console.error("Checkout session error:", err);
    }
  }

  if(STRIPE_PAYMENT_LINK){
    window.location.href = STRIPE_PAYMENT_LINK;
    return;
  }

  // No payment provider configured yet — demo fallback so the flow is testable.
  showToast("Order placed (demo mode — add your payment key in js/checkout.js)");
  localStorage.removeItem(CART_KEY);
  setTimeout(() => { window.location.href = "index.html"; }, 1600);
}
