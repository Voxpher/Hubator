/* Hubator homepage sections.
 * Renders the product containers built in Dashboard -> Homepage.
 * Source: GET {HUBATOR_API_BASE}/api/public/home  (public, no key needed)
 * Depends on js/products.js (hubatorApiUrl, productForStorefront, productUrl,
 * productIsPurchasable, safeProductImageUrl, escapeHtml, fmt) and js/cart.js (addToCart).
 */
(function () {
  "use strict";

  function cardHTML(p) {
    var available = productIsPurchasable(p);
    var url = productUrl(p);
    return (
      '<div class="product-card">' +
        '<a href="' + url + '" class="product-media">' +
          (p.badge
            ? '<span class="product-badge ticket ' + (p.badge === "Sale" ? "on-sale" : "") + '">' + escapeHtml(p.badge) + "</span>"
            : "") +
          '<img src="' + escapeHtml(safeProductImageUrl(p.img)) + '" alt="' + escapeHtml(p.name) + '" loading="lazy">' +
        "</a>" +
        '<div class="product-body">' +
          '<span class="product-cat">' + escapeHtml(p.category) + "</span>" +
          '<h4><a href="' + url + '">' + escapeHtml(p.name) + "</a></h4>" +
          '<div class="product-foot">' +
            '<span class="ticket ' + (p.oldPrice ? "on-sale" : "") + '">' +
              (p.oldPrice ? '<span class="price-old">' + fmt(p.oldPrice) + "</span>" : "") +
              fmt(p.price) +
            "</span>" +
            '<button class="add-btn" data-id="' + escapeHtml(p.id) + '" ' +
              'aria-label="' + (available ? "Add " + escapeHtml(p.name) + " to cart" : escapeHtml(p.name) + " is out of stock") + '" ' +
              (available ? "" : "disabled") +
              ' onclick="addToCart(this.dataset.id)">' + (available ? "+" : "&mdash;") + "</button>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function sectionShell(s, inner) {
    var head =
      '<div class="section-head"><div>' +
        (s.eyebrow ? '<span class="eyebrow">' + escapeHtml(s.eyebrow) + "</span>" : "") +
        "<h2>" + escapeHtml(s.title) + "</h2>" +
        (s.subtitle ? "<p>" + escapeHtml(s.subtitle) + "</p>" : "") +
      "</div>" +
      (s.viewAllUrl
        ? '<a href="' + escapeHtml(s.viewAllUrl) + '" class="btn btn-outline btn-sm">' + escapeHtml(s.viewAllLabel || "View all") + "</a>"
        : "") +
      "</div>";
    return '<section class="section"><div class="wrap">' + head + inner + "</div></section>";
  }

  function renderSection(s) {
    var products = (s.products || [])
      .map(function (raw) {
        try {
          return productForStorefront(raw);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
    if (!products.length) return "";

    var cards = products.map(cardHTML).join("");

    if (s.layout === "carousel") {
      var id = "hs-car-" + String(s.id).replace(/[^a-zA-Z0-9_-]/g, "");
      return sectionShell(
        s,
        '<div class="hs-carousel-wrap">' +
          '<button type="button" class="hs-arrow hs-prev" data-target="' + id + '" aria-label="Scroll products left">&lsaquo;</button>' +
          '<div class="hs-carousel" id="' + id + '">' + cards + "</div>" +
          '<button type="button" class="hs-arrow hs-next" data-target="' + id + '" aria-label="Scroll products right">&rsaquo;</button>' +
        "</div>"
      );
    }

    if (s.layout === "marquee") {
      var autoplay = s.autoplay !== false;
      var speed = Math.max(10, Math.min(120, Number(s.speed) || 30));
      // Two copies back-to-back so the -50% loop is seamless.
      return sectionShell(
        s,
        '<div class="hs-marquee"><div class="hs-marquee-track' + (autoplay ? "" : " hs-paused") + '"' +
          (autoplay ? ' style="animation-duration:' + speed + 's;"' : "") +
          ">" + cards + cards + "</div></div>"
      );
    }

    var cols = Math.max(2, Math.min(4, Number(s.columns) || 4));
    return sectionShell(
      s,
      '<div class="product-grid hs-grid-cols-' + cols + '">' + cards + "</div>"
    );
  }

  function bindArrows(root) {
    var buttons = root.querySelectorAll(".hs-arrow");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var el = document.getElementById(btn.getAttribute("data-target"));
        if (!el) return;
        var dir = btn.classList.contains("hs-prev") ? -1 : 1;
        el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
      });
    });
  }

  function skeletonHTML() {
    var cards = "";
    for (var i = 0; i < 4; i++) cards += '<div class="product-card skeleton"></div>';
    return '<section class="section"><div class="wrap"><div class="product-grid">' + cards + "</div></div></section>";
  }

  function loadHomeSections() {
    var mount = document.getElementById("home-sections");
    if (!mount) return;
    var url = hubatorApiUrl("/api/public/home");
    if (!url) {
      mount.innerHTML = "";
      return;
    }
    mount.innerHTML = skeletonHTML();
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        var sections = data && Array.isArray(data.sections) ? data.sections : [];
        mount.innerHTML = sections.map(renderSection).join("");
        bindArrows(mount);
      })
      .catch(function (err) {
        console.error("[Hubator] home sections:", err);
        mount.innerHTML = "";
      });
  }

  document.addEventListener("DOMContentLoaded", loadHomeSections);
})();
