/**
 * js/products.js — Customer-safe catalog client.
 * No credentials belong in this file or this repository.
 * API base URL is set once in js/config.js as window.HUBATOR_API_BASE.
 */

window.PRODUCTS = [];
let _allProductsRequest = null;
const PRODUCT_CACHE_KEY = "hubator_product_cache_v1";
const PRODUCT_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

function hubatorApiUrl(path) {
  const base = (window.HUBATOR_API_BASE || "").replace(/\/$/, "");
  if (!base || typeof path !== "string" || !path.startsWith("/")) return null;
  return base + path;
}

function productForStorefront(product) {
  if (!product || product._id == null) return null;
  const images = Array.isArray(product.images)
    ? product.images.filter((image) => image && typeof image === "object")
    : [];
  const primaryImage = images
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))[0];
  return {
    id: String(product._id),
    name: String(product.title || "Untitled product"),
    category: String(product.category || "Uncategorized"),
    price: Number.isFinite(Number(product.price)) ? Number(product.price) : 0,
    oldPrice: Number(product.compareAtPrice) > 0 ? Number(product.compareAtPrice) : null,
    img: typeof primaryImage?.url === "string" ? primaryImage.url : "",
    badge: Number(product.compareAtPrice) > 0 ? "Sale" : null,
    desc: String(product.description || product.shortDescription || ""),
    variants: product.variants || [],
    allowCOD: product.allowCOD !== false,
    allowPrepaid: product.allowPrepaid !== false,
    placements: product.placements || [],
    stock: product.stock == null ? null : Math.max(0, Number(product.stock) || 0),
    sortOrder: Number(product.sortOrder) || 0,
  };
}

function readProductCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY));
    if (!cached || typeof cached !== "object" || !Array.isArray(cached[key])) return null;
    if (Date.now() - Number(cached[key + "At"]) > PRODUCT_CACHE_MAX_AGE) return null;
    return cached[key];
  } catch {
    return null;
  }
}

function writeProductCache(key, products) {
  try {
    const cached = JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY));
    const next = cached && typeof cached === "object" ? cached : {};
    next[key] = products;
    next[key + "At"] = Date.now();
    localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(next));
  } catch {
    // Catalog rendering must not fail when browser storage is unavailable.
  }
}

async function _fetchProducts(path) {
  const url = hubatorApiUrl(path);
  if (!url) throw new Error("Store API URL is not configured.");
  let res;
  try {
    res = await fetch(url);
  } catch {
    const cacheKey = path.includes("?placement=") ? "placement:" + path.split("=")[1] : "all";
    const cached = readProductCache(cacheKey);
    if (cached) return cached;
    throw new Error("Unable to load products. Check your connection and try again.");
  }
  if (!res.ok) {
    const cacheKey = path.includes("?placement=") ? "placement:" + path.split("=")[1] : "all";
    const cached = readProductCache(cacheKey);
    if (cached) return cached;
    throw new Error("Could not load products right now. Please refresh.");
  }
  const data = await res.json();
  const products = Array.isArray(data) ? data : data.products;
  if (!Array.isArray(products)) throw new Error("The product catalogue returned an invalid response.");
  const normalized = products.map(productForStorefront).filter(Boolean);
  const cacheKey = path.includes("?placement=") ? "placement:" + path.split("=")[1] : "all";
  writeProductCache(cacheKey, normalized);
  return normalized;
}

function _mergeProducts(products) {
  const byId = new Map(window.PRODUCTS.map((product) => [product.id, product]));
  products.forEach((product) => byId.set(product.id, product));
  window.PRODUCTS = Array.from(byId.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  window.dispatchEvent(new CustomEvent("hubator:products-loaded", { detail: window.PRODUCTS }));
  return window.PRODUCTS;
}

/** Load ALL published products — populates window.PRODUCTS */
async function loadProducts() {
  if (_allProductsRequest) return _allProductsRequest;

  _allProductsRequest = _fetchProducts("/api/public/products")
    .then((products) => {
      window.PRODUCTS = products.sort((a, b) => a.sortOrder - b.sortOrder);
      window.dispatchEvent(new CustomEvent("hubator:products-loaded", { detail: window.PRODUCTS }));
      return window.PRODUCTS;
    })
    .catch((err) => {
      _allProductsRequest = null;
      console.error("[Hubator] loadProducts:", err.message);
      throw err;
    });

  return _allProductsRequest;
}

/** Load products for a specific storefront placement */
async function loadProductsByPlacement(placement) {
  try {
    const products = await _fetchProducts("/api/public/products?placement=" + encodeURIComponent(placement));
    _mergeProducts(products);
    return products;
  } catch (err) {
    console.error("[Hubator] loadProductsByPlacement:", err.message);
    throw err;
  }
}

function getProductById(id) {
  return window.PRODUCTS.find((p) => p.id === String(id)) || null;
}

function productIsPurchasable(product) {
  return Boolean(product) && (product.stock == null || product.stock > 0);
}

function safeProductImageUrl(url) {
  const value = String(url || "").trim();
  return /^(https:\/\/|\/(?!\/)|\.\/)/i.test(value) ? value : "";
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}

function fmt(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}
