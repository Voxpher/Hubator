/* =========================================================
   Cart — stored client-side in localStorage under "eh_cart".
   Shape: [{ id, qty }]
   For a real store, replace read/write here with calls to
   your own backend/database instead of localStorage.
   ========================================================= */
const CART_KEY = "eh_cart";

function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(id, qty=1){
  const cart = getCart();
  const line = cart.find(l => l.id === Number(id));
  if(line){ line.qty += qty; } else { cart.push({ id:Number(id), qty }); }
  saveCart(cart);
  showToast("Added to cart");
}
function removeFromCart(id){
  saveCart(getCart().filter(l => l.id !== Number(id)));
}
function setQty(id, qty){
  const cart = getCart();
  const line = cart.find(l => l.id === Number(id));
  if(!line) return;
  line.qty = Math.max(1, qty);
  saveCart(cart);
}
function cartCount(){
  return getCart().reduce((sum,l) => sum + l.qty, 0);
}
function cartLines(){
  return getCart()
    .map(l => ({ ...l, product: getProductById(l.id) }))
    .filter(l => l.product);
}
function cartSubtotal(){
  return cartLines().reduce((sum,l) => sum + l.product.price * l.qty, 0);
}
function updateCartBadge(){
  document.querySelectorAll(".cart-count").forEach(el => el.textContent = cartCount());
}
function showToast(msg){
  let toast = document.querySelector(".toast");
  if(!toast){
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function fmt(n){
  return "$" + n.toFixed(2);
}

async function createQikinkOrder(cartLines, gateway="COD", qikinkShipping=1) {
  const token = await getAccessToken();
  const items = cartLines.map(l => ({
    search_from_my_products: 0,
    quantity: l.qty,
    price: l.product.price.toString(),
    sku: `hub-${l.product.id}`,
    designs: [],
  }));

  const body = {
    order_number: `hub-${Date.now()}`,
    qikink_shipping: qikinkShipping,
    gateway: gateway,
    total_order_value: cartSubtotal().toString(),
    line_items: items,
  };

  const res = await fetch(`https://${QIKINK.base}.qikink.com/api/order/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.order_url) { window.location.href = data.order_url; return data; }
  throw new Error("Qikink order error: " + JSON.stringify(data));
}

document.addEventListener("DOMContentLoaded", updateCartBadge);

/* Mobile nav toggle, shared across pages */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if(toggle && nav){
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
});
