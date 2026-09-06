/**
 * js/products.js — Customer-safe catalog client.
 * No credentials belong in this file or this repository.
 * API base URL is set once in js/config.js as window.HUBATOR_API_BASE.
 */

window.PRODUCTS = [];

function hubatorApiUrl(path) {
  const base = (window.HUBATOR_API_BASE || "").replace(/\/$/, "");
  if (!base) return null;
  return base + path;
}

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

async function _fetchProducts(path) {
  const url = hubatorApiUrl(path);
  if (!url) throw new Error("Store API URL is not configured.");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load products right now. Please refresh.");
  const data = await res.json();
  return (data.products || []).map(productForStorefront);
}

/** Load ALL published products — populates window.PRODUCTS */
async function loadProducts() {
  try {
    window.PRODUCTS = await _fetchProducts("/api/public/products");
    window.dispatchEvent(new CustomEvent("hubator:products-loaded", { detail: window.PRODUCTS }));
    return window.PRODUCTS;
  } catch (err) {
    console.error("[Hubator] loadProducts:", err.message);
    throw err;
  }
}

/** Load products for a specific storefront placement */
async function loadProductsByPlacement(placement) {
  try {
    return await _fetchProducts("/api/public/products?placement=" + encodeURIComponent(placement));
  } catch (err) {
    console.error("[Hubator] loadProductsByPlacement:", err.message);
    throw err;
  }
}

function getProductById(id) {
  return window.PRODUCTS.find((p) => p.id === String(id)) || null;
}

function fmt(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}
