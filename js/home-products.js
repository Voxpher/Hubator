/* ═══════════════════════════════════════════════════════════════════
   HUBATOR HOMEPAGE — your full Shopify-style home page, in one file.
   ───────────────────────────────────────────────────────────────────
   HOW IT WORKS:
   HOME_PAGE below is your page, top to bottom. Each { type: ... } block
   is one section. To reorder sections, move the whole block up or down.
   To remove a section, delete its block. To add one, copy any block.

   ── SECTION TYPES ──

   { type: "trust" }
       Trust badges strip (Secure checkout / Shipping / Returns).
       Text comes LIVE from Dashboard → Settings → Trust badges.
       No settings needed here — it just works.

   { type: "categories", title, subtitle, limit, tiles }
       "Shop by Category" image tiles.
       AUTOMATIC: tiles are built from your real products — one tile per
       category, using a real product photo. Set limit to show fewer.
       MANUAL (optional): add your own tiles: list, like this:
         tiles: [
           { name: "Kurtas", image: "https://.../kurta.jpg", link: "/shop?category=kurtas" },
           { name: "Shirts", image: "https://.../shirt.jpg", link: "/shop?category=shirts" }
         ]
       Manual tiles replace the automatic ones.

   { type: "products", title, subtitle, layout, columns,
     source, manualIds, limit, link, linkText }
       A product row. YOUR OPTIONS:
       layout:  "grid"     → products in rows (set columns: 2, 3 or 4)
                "carousel" → one sideways row with < > arrows
                "marquee"  → auto-scrolling row, loops forever
       source:  "latest"             → newest first
                "category:Apparel"   → your EXACT category name
                "collection:summer"  → your collection SLUG
                                       (Dashboard → Collections, under the name)
                "on_sale"            → products with a sale price
                "manual"             → hand-picked: put ids in manualIds
                                       (open the product in your dashboard,
                                        copy the id from the page URL)
       limit:     how many products to show
       link / linkText: "View all →" button ("" hides it)

   { type: "banners", items: [ ... ] }
       Full-width image banners (sale announcements, lookbooks).
       Each item: image, eyebrow, heading, text, buttonText, buttonLink,
       align ("left" or "center"). "" hides any text line.

   { type: "image_text", image, eyebrow, heading, text,
     buttonText, buttonLink, flip }
       Brand block: image beside text (Shopify's "Image with text").
       flip: true → image on the right instead of left.

   { type: "testimonials", title, subtitle, items: [ ... ] }
       Customer quotes. Each item: quote, name, detail
       (e.g. "Verified buyer · Mumbai").
       TIP: use your REAL customer words from Dashboard → Reviews.

   ── WHAT EACH FUNCTION DOES (you rarely need to touch these) ──
   pickProducts() ... chooses WHICH products go in a products row
   cardHTML() ....... how ONE product card looks
   trustHTML() ...... the trust badges strip
   categoriesHTML() . "Shop by Category" tiles
   productsHTML() ... a product row (grid / carousel / marquee)
   bannersHTML() .... image banners
   imageTextHTML() .. brand image+text block
   testimonialsHTML() customer quotes
   mount() .......... builds the page in HOME_PAGE order + wires arrows
   ═══════════════════════════════════════════════════════════════════ */

/* ── YOUR PAGE — top to bottom ──────────────────────────────────── */
var HOME_PAGE = [
  /* 1. Trust badges — live from Dashboard → Settings */
  { type: "trust" },

  /* 2. Shop by Category — automatic from your products */
  {
    type: "categories",
    title: "Shop by Category",
    subtitle: "Find your fit.",
    limit: 6
    /* Manual override (optional): tiles: [ { name, image, link }, ... ] */
  },

  /* 3. New arrivals — grid */
  {
    type: "products",
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

  /* 4. Bestsellers — sideways carousel */
  {
    type: "products",
    title: "Bestsellers",
    subtitle: "What everyone is wearing.",
    layout: "carousel",
    columns: 4,
    source: "category:Apparel",   // ← change to YOUR exact category name
    manualIds: [],
    limit: 10,
    link: "/shop",
    linkText: "Shop all"
  },

  /* 5. On sale — auto-scrolling marquee */
  {
    type: "products",
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

  /* ── MORE SECTIONS — copy one into the list above ──

  // Image banner (sale announcement)
  ,{
    type: "banners",
    items: [
      {
        image: "https://res.cloudinary.com/YOUR/image/upload/...jpg",
        eyebrow: "Limited time",
        heading: "Monsoon Sale — up to 40% off",
        text: "Last pieces from independent designers.",
        buttonText: "Shop the sale",
        buttonLink: "/shop",
        align: "left"   // "left" or "center"
      }
    ]
  }

  // Brand block: image beside text
  ,{
    type: "image_text",
    image: "https://res.cloudinary.com/YOUR/image/upload/...jpg",
    eyebrow: "Our promise",
    heading: "Independent designers. Honest materials.",
    text: "Every piece on Hubator comes from an independent designer in a small run. Nothing mass-produced, nothing disposable.",
    buttonText: "Our story",
    buttonLink: "/about",
    flip: false   // true = image on the right
  }

  // Customer quotes — use your REAL words from Dashboard → Reviews
  ,{
    type: "testimonials",
    title: "Loved by customers",
    subtitle: "",
    items: [
      { quote: "The kurta fits perfectly and the fabric feels premium.", name: "Priya S.", detail: "Verified buyer · Mumbai" },
      { quote: "Ordered Tuesday, wearing it Friday. Packaging was lovely.", name: "Rahul V.", detail: "Verified buyer · Delhi" },
      { quote: "Finally a store that sells something different.", name: "Ananya D.", detail: "Verified buyer · Bengaluru" }
    ]
  }

  // Hand-picked products row
  ,{
    type: "products",
    title: "Festive Edit",
    subtitle: "Hand-picked for the season.",
    layout: "grid",
    columns: 4,
    source: "manual",
    manualIds: ["PASTE-ID-1", "PASTE-ID-2", "PASTE-ID-3"],
    limit: 8,
    link: "/shop",
    linkText: "View all"
  }
  */
];

(function () {
  "use strict";

  function esc(s) {
    if (typeof escapeHtml === "function") return escapeHtml(s);
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    if (typeof fmt === "function") return fmt(n);
    return "₹" + Number(n || 0).toLocaleString("en-IN");
  }
  function imgUrl(u) {
    if (typeof safeProductImageUrl === "function") return safeProductImageUrl(u);
    return u || "";
  }
  function prodUrl(p) {
    if (typeof productUrl === "function") return productUrl(p);
    return "/product/" + p.id;
  }
  function canBuy(p) {
    if (typeof productIsPurchasable === "function") return productIsPurchasable(p);
    return true;
  }

  /* ── WHICH products go in a row ─────────────────────────────── */
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
    all.sort(function (a, b) { return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); });
    return all.slice(0, cfg.limit);
  }

  /* ── ONE product card ───────────────────────────────────────── */
  function cardHTML(p) {
    var available = canBuy(p);
    var url = prodUrl(p);
    return (
      '<div class="product-card">' +
        '<a href="' + esc(url) + '" class="product-media">' +
          (p.badge
            ? '<span class="product-badge ticket ' + (p.badge === "Sale" ? "on-sale" : "") + '">' + esc(p.badge) + "</span>"
            : "") +
          '<img src="' + esc(imgUrl(p.img)) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        "</a>" +
        '<div class="product-body">' +
          '<span class="product-cat">' + esc(p.category) + "</span>" +
          '<h4><a href="' + esc(url) + '">' + esc(p.name) + "</a></h4>" +
          '<div class="product-foot">' +
            '<span class="ticket ' + (p.oldPrice ? "on-sale" : "") + '">' +
              (p.oldPrice ? '<span class="price-old">' + money(p.oldPrice) + "</span>" : "") +
              money(p.price) +
            "</span>" +
            '<button class="add-btn" data-id="' + esc(p.id) + '" ' +
              'aria-label="' + (available ? "Add " + esc(p.name) + " to cart" : esc(p.name) + " is out of stock") + '" ' +
              (available ? "" : "disabled") +
              ' onclick="addToCart(this.dataset.id)">' + (available ? "+" : "&mdash;") + "</button>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function headHTML(cfg) {
    return (
      '<div class="hp-head wrap"><div>' +
        "<h2>" + esc(cfg.title) + "</h2>" +
        (cfg.subtitle ? '<p class="hp-sub">' + esc(cfg.subtitle) + "</p>" : "") +
      "</div>" +
      (cfg.link && cfg.linkText
        ? '<a class="hp-viewall" href="' + esc(cfg.link) + '">' + esc(cfg.linkText) + " &rarr;</a>"
        : "") +
      "</div>"
    );
  }

  /* ── TRUST badges strip (live from dashboard settings) ──────── */
  var trustDefaults = [
    { icon: "✓", text: "Secure checkout" },
    { icon: "✈", text: "Fast shipping across India" },
    { icon: "↩", text: "Easy 7-day returns" },
    { icon: "₹", text: "Prices in Indian Rupees" }
  ];
  function trustHTML(badges) {
    var items = (badges && badges.length ? badges : trustDefaults).map(function (b) {
      return '<div class="hp-trust-item"><span class="hp-trust-icon">' + esc(b.icon) + "</span><span>" + esc(b.text) + "</span></div>";
    }).join("");
    return '<section class="hp-trust"><div class="wrap hp-trust-row">' + items + "</div></section>";
  }
  function fetchTrustBadges() {
    try {
      var url = (typeof hubatorApiUrl === "function") ? hubatorApiUrl("/api/public/settings") : null;
      if (!url || typeof fetch !== "function") return Promise.resolve(null);
      return fetch(url).then(function (r) { return r.json(); }).then(function (d) {
        var t = (d && d.trustBadges) || {};
        var out = [];
        if (t.secureCheckout) out.push({ icon: "✓", text: t.secureCheckout });
        if (t.shipping) out.push({ icon: "✈", text: t.shipping });
        if (t.returns) out.push({ icon: "↩", text: t.returns });
        if (t.currency) out.push({ icon: "₹", text: t.currency });
        return out.length ? out : null;
      }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  /* ── SHOP BY CATEGORY tiles (automatic from your products) ──── */
  function categoriesHTML(cfg) {
    var tiles = [];
    if (cfg.tiles && cfg.tiles.length) {
      tiles = cfg.tiles;
    } else {
      var seen = {};
      (window.PRODUCTS || []).forEach(function (p) {
        var name = String(p.category || "").trim();
        if (!name || seen[name]) return;
        seen[name] = true;
        tiles.push({
          name: name,
          image: imgUrl(p.img),
          link: "/shop?category=" + encodeURIComponent(name)
        });
      });
      tiles = tiles.slice(0, cfg.limit || 6);
    }
    if (!tiles.length) return "";
    var html = tiles.map(function (t) {
      return (
        '<a class="hp-cat-tile" href="' + esc(t.link) + '">' +
          '<img src="' + esc(t.image) + '" alt="' + esc(t.name) + '" loading="lazy">' +
          '<span class="hp-cat-label">' + esc(t.name) + "</span>" +
        "</a>"
      );
    }).join("");
    return '<section class="hp-section">' + headHTML(cfg) +
      '<div class="wrap"><div class="hp-cats">' + html + "</div></div></section>";
  }

  /* ── PRODUCT row (grid / carousel / marquee) ────────────────── */
  function productsHTML(cfg, index) {
    var products = pickProducts(cfg);
    if (!products.length) return "";
    var cards = products.map(cardHTML).join("");
    var head = headHTML(cfg);
    if (cfg.layout === "carousel") {
      return (
        '<section class="hp-section" data-hp="' + index + '">' + head +
          '<div class="wrap hp-carousel-wrap">' +
            '<button class="hp-arrow hp-prev" aria-label="Scroll left">&lsaquo;</button>' +
            '<div class="hp-carousel">' + cards + "</div>" +
            '<button class="hp-arrow hp-next" aria-label="Scroll right">&rsaquo;</button>' +
          "</div></section>"
      );
    }
    if (cfg.layout === "marquee") {
      return (
        '<section class="hp-section" data-hp="' + index + '">' + head +
          '<div class="wrap"><div class="hp-marquee"><div class="hp-marquee-track">' +
            cards + cards +
          "</div></div></div></section>"
      );
    }
    var cols = Math.min(4, Math.max(2, cfg.columns || 4));
    return (
      '<section class="hp-section" data-hp="' + index + '">' + head +
        '<div class="wrap"><div class="hp-grid hp-cols-' + cols + '">' + cards + "</div></div></section>"
    );
  }

  /* ── IMAGE banners ──────────────────────────────────────────── */
  function bannersHTML(cfg) {
    var items = (cfg.items || []).filter(function (b) { return b && b.image; });
    if (!items.length) return "";
    return items.map(function (b) {
      return (
        '<section class="hp-section"><div class="wrap">' +
          '<div class="hb-banner hb-' + (b.align === "center" ? "center" : "left") + '" style="background-image:url(\'' + esc(b.image) + "')\">" +
            '<div class="hb-overlay"></div><div class="hb-content">' +
              (b.eyebrow ? '<p class="hb-eyebrow">' + esc(b.eyebrow) + "</p>" : "") +
              "<h2>" + esc(b.heading) + "</h2>" +
              (b.text ? "<p>" + esc(b.text) + "</p>" : "") +
              (b.buttonText && b.buttonLink
                ? '<a class="btn" href="' + esc(b.buttonLink) + '">' + esc(b.buttonText) + "</a>"
                : "") +
            "</div></div></div></section>"
      );
    }).join("");
  }

  /* ── IMAGE + TEXT brand block ───────────────────────────────── */
  function imageTextHTML(cfg) {
    if (!cfg.image || !cfg.heading) return "";
    return (
      '<section class="hp-section"><div class="wrap">' +
        '<div class="hp-imagetext' + (cfg.flip ? " hp-flip" : "") + '">' +
          '<div class="hp-imagetext-media"><img src="' + esc(cfg.image) + '" alt="' + esc(cfg.heading) + '" loading="lazy"></div>' +
          '<div class="hp-imagetext-body">' +
            (cfg.eyebrow ? '<p class="hb-eyebrow">' + esc(cfg.eyebrow) + "</p>" : "") +
            "<h2>" + esc(cfg.heading) + "</h2>" +
            (cfg.text ? "<p>" + esc(cfg.text) + "</p>" : "") +
            (cfg.buttonText && cfg.buttonLink
              ? '<a class="btn" href="' + esc(cfg.buttonLink) + '">' + esc(cfg.buttonText) + "</a>"
              : "") +
          "</div></div></div></section>"
    );
  }

  /* ── TESTIMONIALS ───────────────────────────────────────────── */
  function testimonialsHTML(cfg) {
    var items = (cfg.items || []).filter(function (t) { return t && t.quote; });
    if (!items.length) return "";
    var html = items.map(function (t) {
      return (
        '<div class="hp-quote"><div class="hp-stars">★★★★★</div>' +
          "<p>“" + esc(t.quote) + "”</p>" +
          '<div class="hp-quote-who"><strong>' + esc(t.name || "") + "</strong>" +
          (t.detail ? "<span>" + esc(t.detail) + "</span>" : "") + "</div></div>"
      );
    }).join("");
    return '<section class="hp-section hp-testimonials">' + headHTML(cfg) +
      '<div class="wrap"><div class="hp-quotes">' + html + "</div></div></section>";
  }

  /* ── BUILD the page in HOME_PAGE order ──────────────────────── */
  function render(badges) {
    var out = [];
    HOME_PAGE.forEach(function (cfg, i) {
      switch (cfg.type) {
        case "trust":        out.push(trustHTML(badges)); break;
        case "categories":    out.push(categoriesHTML(cfg)); break;
        case "products":      out.push(productsHTML(cfg, i)); break;
        case "banners":       out.push(bannersHTML(cfg)); break;
        case "image_text":    out.push(imageTextHTML(cfg)); break;
        case "testimonials":  out.push(testimonialsHTML(cfg)); break;
      }
    });
    return out.join("");
  }

  function mount() {
    var host = document.getElementById("home-products");
    if (!host) return;
    fetchTrustBadges().then(function (badges) {
      host.innerHTML = render(badges);
      host.querySelectorAll(".hp-carousel-wrap").forEach(function (wrapEl) {
        var track = wrapEl.querySelector(".hp-carousel");
        wrapEl.querySelector(".hp-prev").addEventListener("click", function () {
          track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
        });
        wrapEl.querySelector(".hp-next").addEventListener("click", function () {
          track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
        });
      });
    });
  }

  if (window.PRODUCTS && window.PRODUCTS.length) {
    mount();
  } else {
    window.addEventListener("hubator:products-loaded", mount);
  }
})();
