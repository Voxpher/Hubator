(function () {
  "use strict";

  var root = document.getElementById("pd-root");
  var crumb = document.getElementById("crumb-name");

  function showState(message, className) {
    if (!root) return;
    root.className = "wrap pd-grid " + (className || "");
    root.textContent = message;
  }

  function variantLabel(value) {
    var variant = value || {};
    return [variant.color, variant.size].filter(Boolean).join(" / ") || "Default";
  }

  function render(product) {
    var available = productIsPurchasable(product);
    var variants = product.variants && typeof product.variants.forEach === "function"
      ? Array.from(product.variants.entries()).filter(function (entry) { return entry[0] !== "base"; })
      : [];
    var gallery = (product.gallery || []).map(safeProductImageUrl).filter(Boolean);
    if (!gallery.length && product.img) gallery.push(safeProductImageUrl(product.img));
    var selectedVariant = variants.length ? variants[0][0] : null;

    document.title = product.name + " — Hubator";
    if (crumb) crumb.textContent = product.name;
    root.className = "wrap pd-grid";
    root.innerHTML =
      '<div class="pd-gallery">' +
        '<div class="pd-gallery-main"><img src="' + escapeHtml(gallery[0] || "") + '" alt="' + escapeHtml(product.name) + '"></div>' +
        (gallery.length > 1 ? '<div class="pd-thumbs">' + gallery.map(function (url, index) {
          return '<img src="' + escapeHtml(url) + '" alt="" class="' + (index === 0 ? "active" : "") + '">';
        }).join("") + "</div>" : "") +
      "</div>" +
      '<div class="pd-info">' +
        '<span class="product-cat">' + escapeHtml(product.category) + "</span>" +
        "<h1>" + escapeHtml(product.name) + "</h1>" +
        '<div class="pd-price-row"><span class="pd-price">' + fmt(product.price) + "</span>" +
          (product.oldPrice ? '<span class="price-old">' + fmt(product.oldPrice) + "</span>" : "") + "</div>" +
        '<p class="pd-desc">' + escapeHtml(product.desc || "No description is available for this product.") + "</p>" +
        (!available ? '<p class="product-stock-status" role="status">Out of stock</p>' : "") +
        (variants.length ? '<label class="pd-variant-label" for="pd-variant">Variant</label><select id="pd-variant" class="pd-variant-select">' +
          variants.map(function (entry) {
            return '<option value="' + escapeHtml(entry[0]) + '">' + escapeHtml(variantLabel(entry[1])) + "</option>";
          }).join("") + "</select>" : "") +
        '<div class="pd-actions">' +
          '<button id="pd-add" class="btn btn-primary" ' + (!available ? "disabled" : "") + ">Add to cart</button>" +
          '<a id="pd-buy" href="' + (available ? "/checkout" : "#") + '" class="btn btn-outline" ' + (!available ? 'aria-disabled="true"' : "") + ">Buy now</a>" +
        "</div>" +
        '<ul class="pd-meta"><li>Prices shown in Indian Rupees</li><li>Shipping is calculated securely at checkout</li></ul>' +
      "</div>";

    var select = document.getElementById("pd-variant");
    var add = document.getElementById("pd-add");
    var buy = document.getElementById("pd-buy");
    function currentVariant() { return select ? select.value : selectedVariant; }
    if (select) select.value = selectedVariant;
    if (add) add.addEventListener("click", function () {
      addToCart(product.id, 1, currentVariant());
    });
    if (buy && available) buy.addEventListener("click", function () {
      if (!addToCart(product.id, 1, currentVariant())) this.preventDefault();
    });
  }

  function load() {
    var reference = productReferenceFromLocation(window.location);
    if (!reference.value) {
      showState("Choose a product from the shop to view its details.", "pd-state");
      return;
    }
    loadProducts().then(function () {
      var product = getProductFromReference(reference);
      if (!product) {
        var duplicate = reference.type !== "id" && window.PRODUCTS.filter(function (p) {
          return p.slug && p.slug.toLowerCase() === reference.value.toLowerCase();
        }).length > 1;
        showState(duplicate ? "This product link is unavailable because its slug is duplicated." : "That product is no longer available.", "pd-state");
        return;
      }
      if (reference.type !== "slug" || reference.value !== product.slug) {
        history.replaceState(null, "", productUrl(product));
      }
      render(product);
    }).catch(function (error) {
      console.error("[Hubator] product:", error);
      showState(error && error.message ? error.message : "We couldn't load this product. Please refresh and try again.", "pd-state");
    });
  }

  showState("Loading product details…", "pd-state");
  load();
}());
