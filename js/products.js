/* Customer-safe catalog client. No credentials belong in this repository.
 *
 * API base URL is configured once in js/config.js as window.HUBATOR_API_BASE.
 * Never add API keys, secrets, or tokens to this file — it lives in a public repo.
 */

window.PRODUCTS = [];

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function hubatorApiUrl(path) {
  const base = (window.HUBATOR_API_BASE || "").replace(/\/$/, "");
  if (!base) throw new Error("The store API URL has not been configured yet.");
  return base + path;
}

// ---------------------------------------------------------------------------
// Shape a raw API product into the flat object the UI expects
// ---------------------------------------------------------------------------

function productForStorefront(product) {
  const primaryImage = product.images
    ?.slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))[0];
  return {
    id: String(product._id),
    name: product.title,
    category: product.category || "Uncategorized",
    price: product.price,
    oldPrice: product.compareAtPrice || null,
    img: primaryImage?.url || "",
    badge: product.compareAtPrice ? "Sale" : null,
    desc: product.description || product.shortDescription || "",
    stock: product.stock,
    variants: product.variants || [],
    placements: product.placements || [],
    sortOrder: product.sortOrder ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Load ALL published products (shop page, product detail lookup)
// ---------------------------------------------------------------------------

async function loadProducts() {
  const response = await fetch(hubatorApiUrl("/api/public/products"));
  if (!response.ok) throw new Error("We could not load products right now.");
  const data = await response.json();
  window.PRODUCTS = (data.products || []).map(productForStorefront);
  window.dispatchEvent(new CustomEvent("hubator:products-loaded", { detail: window.PRODUCTS }));
  return window.PRODUCTS;
}

// ---------------------------------------------------------------------------
// Load products for a specific storefront placement
// (used by homepage sections — only fetches what that section needs)
// ---------------------------------------------------------------------------

async function loadProductsByPlacement(placement) {
  const url = hubatorApiUrl("/api/public/products") + "?placement=" + encodeURIComponent(placement);
  const response = await fetch(url);
  if (!response.ok) throw new Error("We could not load products right now.");
  const data = await response.json();
  // Results arrive pre-sorted by sortOrder asc from the API
  return (data.products || []).map(productForStorefront);
}

// ---------------------------------------------------------------------------
// Lookup helpers (operate on the in-memory cache populated by loadProducts)
// ---------------------------------------------------------------------------

function getProductById(id) {
  return window.PRODUCTS.find((product) => product.id === String(id));
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

function fmt(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
