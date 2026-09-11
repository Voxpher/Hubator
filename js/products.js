/**
 * js/products.js — Customer-safe catalog client.
 * No credentials belong in this file or this repository.
 * API base URL is set once in js/config.js as window.HUBATOR_API_BASE.
 */

window.PRODUCTS = [];
var _allProductsRequest = null;
var PRODUCT_CACHE_KEY = "hubator_product_cache_v1";
var PRODUCT_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

function hubatorApiUrl(path) {
  var base = (window.HUBATOR_API_BASE || "").replace(/\/$/, "");
  if (!base || typeof path !== "string" || !path.startsWith("/")) return null;
  return base + path;
}

function productForStorefront(product) {
  if (!product || product._id == null) return null;

  var images = Array.isArray(product.images)
    ? product.images.filter(function(img) { return img && typeof img === "object"; })
    : [];
  var sortedImages = images.slice().sort(function(a, b) { return (a.position || 0) - (b.position || 0); });
  var primaryImage = sortedImages[0];
  var allImageUrls = sortedImages.map(function(img) { return img.url; }).filter(function(u) { return typeof u === "string"; });

  var variants = product.variants || [];
  var variantMap = new Map();
  variants.forEach(function(v) {
    var key = (v.color || "") + "-" + (v.size || "");
    key = key.replace(/^-|-$/g, "") || "base";
    variantMap.set(key, {
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
      sku: v.sku,
      priceOverride: v.priceOverride,
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold,
      backorderAllowed: v.backorderAllowed,
      qikinkSku: v.qikinkSku,
    });
  });

  var lowestVariantStock = null;
  if (variants.length > 0) {
    var stocks = variants.map(function(v) {
      return v.stock != null ? Number(v.stock) : (product.stock || 0);
    });
    lowestVariantStock = Math.min.apply(null, stocks);
  }

  var primaryUrl = primaryImage && typeof primaryImage.url === "string" ? primaryImage.url : "";

  return {
    id: String(product._id),
    name: String(product.title || "Untitled product"),
    category: String(product.category || "Uncategorized"),
    price: Number.isFinite(Number(product.price)) ? Number(product.price) : 0,
    oldPrice: Number(product.compareAtPrice) > 0 ? Number(product.compareAtPrice) : null,
    img: primaryUrl,
    gallery: allImageUrls.length > 0 ? allImageUrls : [],
    badge: Number(product.compareAtPrice) > 0 ? "Sale" : null,
    desc: String(product.description || product.shortDescription || ""),
    variants: variantMap,
    allowCOD: product.allowCOD !== false,
    allowPrepaid: product.allowPrepaid !== false,
    placements: product.placements || [],
    stock: product.stock == null ? null : Math.max(0, Number(product.stock) || 0),
    sortOrder: Number(product.sortOrder) || 0,
    hasVariants: variants.length > 0,
    lowestVariantStock: lowestVariantStock,
  };
}

function readProductCache(key) {
  try {
    var cached = JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY));
    if (!cached || typeof cached !== "object" || !Array.isArray(cached[key])) return null;
    if (Date.now() - Number(cached[key + "At"]) > PRODUCT_CACHE_MAX_AGE) return null;
    return cached[key];
  } catch (e) {
    return null;
  }
}

function writeProductCache(key, products) {
  try {
    var existing = localStorage.getItem(PRODUCT_CACHE_KEY);
    var cached = existing ? JSON.parse(existing) : {};
    if (!cached || typeof cached !== "object") cached = {};
    cached[key] = products;
    cached[key + "At"] = Date.now();
    localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    // Storage unavailable — silent fail
  }
}

function _fetchProducts(path) {
  var url = hubatorApiUrl(path);
  if (!url) return Promise.reject(new Error("Store API URL is not configured."));

  var cacheKey = path.indexOf("?placement=") !== -1 ? "placement:" + path.split("=")[1] : "all";

  return fetch(url).then(function(res) {
    if (!res.ok) {
      var cached = readProductCache(cacheKey);
      if (cached) return cached;
      return Promise.reject(new Error("Could not load products right now. Please refresh."));
    }
    return res.json().then(function(data) {
      var products = Array.isArray(data) ? data : data.products;
      if (!Array.isArray(products)) return Promise.reject(new Error("The product catalogue returned an invalid response."));
      var normalized = products.map(productForStorefront).filter(Boolean);
      writeProductCache(cacheKey, normalized);
      return normalized;
    });
  }).catch(function(err) {
    var cached = readProductCache(cacheKey);
    if (cached) return cached;
    throw err;
  });
}

function _mergeProducts(products) {
  var byId = new Map(window.PRODUCTS.map(function(p) { return [p.id, p]; }));
  products.forEach(function(p) { byId.set(p.id, p); });
  window.PRODUCTS = Array.from(byId.values()).sort(function(a, b) { return a.sortOrder - b.sortOrder; });
  window.dispatchEvent(new CustomEvent("hubator:products-loaded", { detail: window.PRODUCTS }));
  return window.PRODUCTS;
}

function loadProducts() {
  if (_allProductsRequest) return _allProductsRequest;

  _allProductsRequest = _fetchProducts("/api/public/products").then(function(products) {
    window.PRODUCTS = products.sort(function(a, b) { return a.sortOrder - b.sortOrder; });
    window.dispatchEvent(new CustomEvent("hubator:products-loaded", { detail: window.PRODUCTS }));
    return window.PRODUCTS;
  }).catch(function(err) {
    _allProductsRequest = null;
    console.error("[Hubator] loadProducts:", err.message);
    throw err;
  });

  return _allProductsRequest;
}

function loadProductsByPlacement(placement) {
  return _fetchProducts("/api/public/products?placement=" + encodeURIComponent(placement)).then(function(products) {
    _mergeProducts(products);
    return products;
  }).catch(function(err) {
    console.error("[Hubator] loadProductsByPlacement:", err.message);
    throw err;
  });
}

function getProductById(id) {
  return window.PRODUCTS.find(function(p) { return p.id === String(id); }) || null;
}

function productIsPurchasable(product) {
  return Boolean(product) && (product.stock == null || product.stock > 0);
}

function safeProductImageUrl(url) {
  var value = String(url || "").trim();
  return /^(https:\/\/|\/(?!\/)|\.\/)/i.test(value) ? value : "";
}

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function(c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function fmt(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}
