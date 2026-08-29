/* =========================================================
   Qikink Payment Integration
   -----------------------------------------------------------
   This static site posts the cart to Qikink's Create Order API.
   Set QIKINK_BASE to "sandbox" (testing) or "live" (production).
   ========================================================= */

QIKINK = QIKINK || { base: "sandbox" };

async function startCheckout(){
  const lines = cartLines();
  if(lines.length === 0){
    showToast("Your cart is empty");
    return;
  }

  try{
    const data = await createQikinkOrder(lines, "COD", 1);
    if(data.order_url){ window.location.href = data.order_url; return; }
    showToast("Order created — redirecting to checkout");
    localStorage.removeItem("eh_cart");
    setTimeout(() => { window.location.href = "index.html"; }, 1600);
  }catch(err){
    console.error("Qikink checkout error:", err);
    showToast("Checkout failed — " + (err.message || err));
  }
}
