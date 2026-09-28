/* ═══════════════════════════════════════════════════════════════════
   HUBATOR HOMEPAGE — everything on your home page, controlled from here.
   ───────────────────────────────────────────────────────────────────
   WHAT EACH PART DOES:

   • HOME_BANNERS ...... image banners (sale announcements, lookbooks).
                         Copy a block, change image/text/button.
   • HOME_SECTIONS ..... product containers (the shop rows).
                         Copy a block, pick layout + which products.
   • pickProducts() .... decides WHICH products go in a container.
   • cardHTML() ........ how ONE product card looks (shared site-wide).
   • sectionHTML() ..... builds the container (grid / carousel / marquee).
   • mount() ........... puts everything on the page + wires the arrows.

   ── PRODUCT CONTAINERS: YOUR OPTIONS ──

   layout:  "grid"     → products in rows. Set columns: 2, 3 or 4.
            "carousel" → one sideways row with < > arrows.
            "marquee"  → auto-scrolling row that loops forever.

   source:  "latest"             → newest products first.
            "category:Apparel"   → everything in that category
                                   (use your exact category name).
            "collection:summer"  → everything in that dashboard
                                   collection (use the collection slug).
            "on_sale"            → products with a sale price.
            "manual"             → hand-picked. Put product ids in
                                   manualIds: ["id1", "id2"].
                                   (Find an id: open the product in your
                                   dashboard, copy it from the URL.)

   limit:   how many products to show (e.g. 8).

   title / subtitle: the heading above the container.
   link / linkText:  the "View all →" button. Use "" to hide it.

   ── BANNERS: YOUR OPTIONS ──
   image:    full image URL (upload it in Dashboard → Media, copy the URL).
   eyebrow:  small text above the heading ("" hides it).
   heading / text: the big message.
   buttonText / buttonLink: the button ("" hides it).
   align:    "left" or "center".
   ═══════════════════════════════════════════════════════════════════ */

/* ── 1. BANNERS: copy a block to add another banner ─────────────── */
var HOME_BANNERS = [
  /*
  {
    image: "https://res.cloudinary.com/YOUR/image/upload/...jpg",
    eyebrow: "Limited time",
    heading: "Monsoon Sale — up to 40% off",
    text: "Last pieces from independent designers. When they're gone, they're gone.",
    buttonText: "Shop the sale",
    buttonLink: "/shop",
    align: "left"
  },
  */
];

/* ── 2. PRODUCT CONTAINERS: copy a block to add another row ─────── */
var HOME_SECTIONS = [
  {
    title: "New Arrivals",
    subtitle: "Fresh drops, small runs.",
    layout: "grid",          // "grid" | "carousel" | "marquee"
    columns: 4,              // grid columns on desktop (2, 3 or 4)
    source: "latest",        // "latest" | "category:X" | "collection:slug" | "on_sale" | "manual"
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
    link: "/shop",
    linkText: "All deals"
  }
  /* ── EXAMPLE: hand-picked collection ──
  ,
  {
    title: "Festive Edit",
    subtitle: "Hand-picked for the season.",
    layout: "grid",
    columns: 4,
    source: "collection:festive-edit",
    manualIds: [],
    limit: 8,
    link: "/shop",
    linkText: "View all"
  }
  ── EXAMPLE: hand-picked products ──
  ,
  {
    title: "Staff Picks",
    subtitle: "Our personal favourites.",
    layout: "carousel",
    columns: 4,
    source: "manual",
    manualIds: ["PASTE-ID-1", "PASTE-ID-2", "PASTE-ID-3"],
    limit: 8,
    link: "",
    linkText: ""
  }
  */
];

(function () {
  "use strict";

  /* ── 3. WHICH PRODUCTS go in a container ──────────────────────── */
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
    if (cfg.source && cfg.source.indexOf("collection:") === 0) {
      var slug = cfg.source.slice(11).toLowerCase();
      return all.filter(function (p) {
        return (p.collections || []).some(function (c) { return String(c).toLowerCase() === slug; });
      }).slice(0, cfg.limit);
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

  /* ── 4. HOW ONE product card looks ────────────────────────────── */
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

  /* ── 5. HOW ONE banner looks ──────────────────────────────────── */
  function bannerHTML(b) {
    return (
      '<section class="hp-section"><div class="wrap">' +
        '<div class="hb-banner hb-' + (b.align === "center" ? "center" : "left") + '" style="background-image:url(\'' + escapeHtml(b.image) + "')\">" +
          '<div class="hb-overlay"></div>' +
          '<div class="hb-content">' +
            (b.eyebrow ? '<p class="hb-eyebrow">' + escapeHtml(b.eyebrow) + "</p>" : "") +
            "<h2>" + escapeHtml(b.heading) + "</h2>" +
            (b.text ? "<p>" + escapeHtml(b.text) + "</p>" : "") +
            (b.buttonText && b.buttonLink
              ? '<a class="btn" href="' + escapeHtml(b.buttonLink) + '">' + escapeHtml(b.buttonText) + "</a>"
              : "") +
          "</div>" +
        "</div>" +
      "</div></section>"
    );
  }

  /* ── 6. HOW ONE product container is built ────────────────────── */
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
      /* Cards are duplicated so the loop is seamless. */
      return (
        '<section class="hp-section" data-hp="' + index + '">' + head +
          '<div class="wrap"><div class="hp-marquee"><div class="hp-marquee-track">' +
            cards + cards +
          "</div></div></div>" +
        "</section>"
      );
    }
    /* grid (default): rows of products */
    var cols = Math.min(4, Math.max(2, cfg.columns || 4));
    return (
      '<section class="hp-section" data-hp="' + index + '">' + head +
        '<div class="wrap"><div class="hp-grid hp-cols-' + cols + '">' + cards + "</div></div>" +
      "</section>"
    );
  }

  /* ── 7. PUT EVERYTHING on the page ────────────────────────────── */
  function mount() {
    var host = document.getElementById("home-products");
    if (!host) return;
    var html = (HOME_BANNERS || []).map(bannerHTML).join("") +
               HOME_SECTIONS.map(sectionHTML).join("");
    host.innerHTML = html;

    /* Wire the carousel < > arrows */
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

  /* Wait for the catalog (products.js fires this event when loaded). */
  if (window.PRODUCTS && window.PRODUCTS.length) {
    mount();
  } else {
    window.addEventListener("hubator:products-loaded", mount);
  }
})();
