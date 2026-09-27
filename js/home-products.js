/* ═══════════════════════════════════════════════════════════════════
   HUBATOR HOMEPAGE — product sections.
   ───────────────────────────────────────────────────────────────────
   HOW TO EDIT (all in VS Code, no dashboard needed):

   1. TO ADD A NEW PRODUCT CONTAINER:
      Copy one of the { ... } blocks in HOME_SECTIONS below, paste it
      after the last one (don't forget the comma), and change the values.

   2. LAYOUTS (pick one per section):
      "grid"     → rows of products, side by side (set columns: 2, 3 or 4)
      "carousel" → one row with < > arrows to slide
      "marquee"  → auto-scrolling row, loops forever

   3. SOURCES (where the products come from):
      "latest"            → newest products first
      "category:Apparel"  → products in that category (change the name)
      "on_sale"           → products with a sale price
      "manual"            → you pick: put product ids in manualIds: [...]

   4. OTHER KNOBS:
      limit: how many products to show. title / subtitle: the headings.
      link / linkText: the "View all →" button ("" hides it).
   ═══════════════════════════════════════════════════════════════════ */

var HOME_SECTIONS = [
  {
    title: "New Arrivals",
    subtitle: "Fresh drops, small runs.",
    layout: "grid",
    columns: 4,
    source: "latest",
    manualIds: [],
    limit: 8,
    link: "/shop",
    linkText: "View all"
  },
  {
    title: "Bestsellers",
    subtitle: "What everyone is wearing.",
    layout: "carousel",
    columns: 4,
    source: "category:Apparel",
    manualIds: [],
    limit: 10,
    link: "/shop",
    linkText: "Shop all"
  },
  {
    title: "On Sale",
    subtitle: "Last pieces, honest prices.",
    layout: "marquee",
    columns: 4,
    source: "on_sale",
    manualIds: [],
    limit: 10,
    link: "/shop?sort=price-asc",
    linkText: "All deals"
  }
];

(function () {
  "use strict";

  /* Pick products for a section from the already-loaded catalog. */
  function pickProducts(cfg) {
    var all = (window.PRODUCTS || []).slice();
    if (cfg.source === "manual") {
      var ids = {};
      (cfg.manualIds || []).forEach(function (id) { ids[String(id)] = true; });
      return all.filter(function (p) { return ids[String(p.id)]; }).slice(0, cfg.limit);
    }
    if (cfg.source === "on_sale") {
      return all.filter(function (p) { return p.oldPrice && p.oldPrice > p.price; }).slice(0, cfg.limit);
    }
    if (cfg.source && cfg.source.indexOf("category:") === 0) {
      var cat = cfg.source.slice(9).toLowerCase();
      return all.filter(function (p) {
        return String(p.category || "").toLowerCase() === cat;
      }).slice(0, cfg.limit);
    }
    /* "latest" (default): newest first */
    all.sort(function (a, b) {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    return all.slice(0, cfg.limit);
  }

  /* Same card markup as the shop page. */
  function cardHTML(p) {
    var available = typeof productIsPurchasable === "function" ? productIsPurchasable(p) : true;
    var url = typeof productUrl === "function" ? productUrl(p) : "/product/" + p.id;
    var img = typeof safeProductImageUrl === "function" ? safeProductImageUrl(p.img) : (p.img || "");
    return (
      '<div class="product-card">' +
        '<a href="' + escapeHtml(url) + '" class="product-media">' +
          (p.badge
            ? '<span class="product-badge ticket ' + (p.badge === "Sale" ? "on-sale" : "") + '">' + escapeHtml(p.badge) + "</span>"
            : "") +
          '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(p.name) + '" loading="lazy">' +
        "</a>" +
        '<div class="product-body">' +
          '<span class="product-cat">' + escapeHtml(p.category) + "</span>" +
          '<h4><a href="' + escapeHtml(url) + '">' + escapeHtml(p.name) + "</a></h4>" +
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

  function sectionHTML(cfg, index) {
    var products = pickProducts(cfg);
    if (!products.length) return "";
    var cards = products.map(cardHTML).join("");
    var head =
      '<div class="hp-head wrap">' +
        "<div>" +
          "<h2>" + escapeHtml(cfg.title) + "</h2>" +
          (cfg.subtitle ? '<p class="hp-sub">' + escapeHtml(cfg.subtitle) + "</p>" : "") +
        "</div>" +
        (cfg.link && cfg.linkText
          ? '<a class="hp-viewall" href="' + escapeHtml(cfg.link) + '">' + escapeHtml(cfg.linkText) + " &rarr;</a>"
          : "") +
      "</div>";

    if (cfg.layout === "carousel") {
      return (
        '<section class="hp-section" data-hp="' + index + '">' + head +
          '<div class="wrap hp-carousel-wrap">' +
            '<button class="hp-arrow hp-prev" aria-label="Scroll left">&lsaquo;</button>' +
            '<div class="hp-carousel">' + cards + "</div>" +
            '<button class="hp-arrow hp-next" aria-label="Scroll right">&rsaquo;</button>' +
          "</div>" +
        "</section>"
      );
    }
    if (cfg.layout === "marquee") {
      /* Duplicate the cards so the loop is seamless. */
      return (
        '<section class="hp-section" data-hp="' + index + '">' + head +
          '<div class="wrap"><div class="hp-marquee"><div class="hp-marquee-track">' +
            cards + cards +
          "</div></div></div>" +
        "</section>"
      );
    }
    /* grid (default) */
    var cols = Math.min(4, Math.max(2, cfg.columns || 4));
    return (
      '<section class="hp-section" data-hp="' + index + '">' + head +
        '<div class="wrap"><div class="hp-grid hp-cols-' + cols + '">' + cards + "</div></div>" +
      "</section>"
    );
  }

  function mount() {
    var host = document.getElementById("home-products");
    if (!host) return;
    host.innerHTML = HOME_SECTIONS.map(sectionHTML).join("");

    /* Carousel arrows */
    host.querySelectorAll(".hp-carousel-wrap").forEach(function (wrapEl) {
      var track = wrapEl.querySelector(".hp-carousel");
      wrapEl.querySelector(".hp-prev").addEventListener("click", function () {
        track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
      });
      wrapEl.querySelector(".hp-next").addEventListener("click", function () {
        track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
      });
    });
  }

  /* Wait for the catalog (products.js fires this when loaded). */
  if (window.PRODUCTS && window.PRODUCTS.length) {
    mount();
  } else {
    window.addEventListener("hubator:products-loaded", mount);
  }
})();
