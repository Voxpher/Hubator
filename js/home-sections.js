/* Hubator homepage blocks.
 * Renders the content blocks built in Dashboard -> Homepage, in order.
 * Source: GET {HUBATOR_API_BASE}/api/public/home  (public, no key needed)
 * Depends on js/products.js (hubatorApiUrl, productForStorefront, productUrl,
 * productIsPurchasable, safeProductImageUrl, escapeHtml, fmt) and js/cart.js (addToCart).
 */
(function () {
  "use strict";

  /* ---------- shared ---------- */

  function sectionHead(s, opts) {
    opts = opts || {};
    var head =
      '<div class="section-head"><div>' +
        (s.eyebrow ? '<span class="eyebrow">' + escapeHtml(s.eyebrow) + "</span>" : "") +
        (s.title && !opts.hideTitle ? "<h2>" + escapeHtml(s.title) + "</h2>" : "") +
        (s.subtitle ? "<p>" + escapeHtml(s.subtitle) + "</p>" : "") +
      "</div>" +
      (s.viewAllUrl && opts.viewAll !== false
        ? '<a href="' + escapeHtml(s.viewAllUrl) + '" class="btn btn-outline btn-sm hb-viewall">' + escapeHtml(s.viewAllLabel || "View all") + "</a>"
        : "") +
      "</div>";
    return head;
  }

  function wrapSection(s, inner, opts) {
    return '<section class="section"><div class="wrap">' + sectionHead(s, opts) + inner + "</div></section>";
  }

  /* ---------- products block ---------- */

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

  function renderProducts(s) {
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
      return wrapSection(
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
      return wrapSection(
        s,
        '<div class="hs-marquee"><div class="hs-marquee-track' + (autoplay ? "" : " hs-paused") + '"' +
          (autoplay ? ' style="animation-duration:' + speed + 's;"' : "") +
          ">" + cards + cards + "</div></div>"
      );
    }

    var cols = Math.max(2, Math.min(4, Number(s.columns) || 4));
    return wrapSection(s, '<div class="product-grid hs-grid-cols-' + cols + '">' + cards + "</div>");
  }

  /* ---------- banner block ----------
   * Background: video (mp4) when videoUrl is set, else image.
   * bannerHeight: standard | tall | hero (hero = full-screen, full-bleed). */

  function renderBanner(s) {
    var hasVideo = Boolean(s.videoUrl);
    var hasImage = Boolean(s.imageUrl);
    if (!hasVideo && !hasImage) return "";

    var alignCls = s.align === "left" ? "hb-left" : s.align === "right" ? "hb-right" : "hb-center";
    var heightCls = s.bannerHeight === "hero" ? " hb-hero" : s.bannerHeight === "tall" ? " hb-tall" : "";
    var blurCls = s.blurBackground ? " hb-blur" : "";

    var bgHtml;
    if (hasVideo) {
      bgHtml =
        '<div class="hb-bg' + blurCls + '">' +
          '<video class="hb-bg-video" src="' + escapeHtml(s.videoUrl) + '"' +
            (hasImage ? ' poster="' + escapeHtml(s.imageUrl) + '"' : "") +
            ' autoplay muted loop playsinline aria-hidden="true" tabindex="-1"></video>' +
        "</div>";
    } else {
      bgHtml =
        '<div class="hb-bg' + blurCls + '" style="background-image:url(\'' +
          escapeHtml(s.imageUrl).replace(/'/g, "%27") + '\');"></div>';
    }

    var overlayHtml = "";
    if (s.overlay !== false) {
      var op = Math.max(0, Math.min(90, Number(s.overlayOpacity != null ? s.overlayOpacity : 45))) / 100;
      overlayHtml = '<div class="hb-overlay" style="opacity:' + op + ';"></div>';
    }

    var btnCls = s.buttonStyle === "outline" ? "btn btn-outline-light" : "btn btn-gold";

    var inner =
      '<div class="hb-banner ' + alignCls + heightCls + '">' +
        bgHtml +
        overlayHtml +
        '<div class="hb-content">' +
          (s.eyebrow ? '<span class="eyebrow hb-eyebrow">' + escapeHtml(s.eyebrow) + "</span>" : "") +
          (s.title ? "<h2>" + escapeHtml(s.title) + "</h2>" : "") +
          (s.subtitle ? "<p>" + escapeHtml(s.subtitle) + "</p>" : "") +
          (s.viewAllUrl ? '<a href="' + escapeHtml(s.viewAllUrl) + '" class="' + btnCls + '">' + escapeHtml(s.viewAllLabel || "Shop now") + "</a>" : "") +
        "</div>" +
      "</div>";

    // Hero banners are full-bleed (edge to edge); others sit in the page wrap as cards.
    if (s.bannerHeight === "hero") {
      return '<section class="section hb-hero-section">' + inner + "</section>";
    }
    return '<section class="section"><div class="wrap">' + inner + "</div></section>";
  }

  /* ---------- text block ---------- */

  function renderText(s) {
    var paras = String(s.body || "")
      .split(/\n\s*\n/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean)
      .map(function (p) { return "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>"; })
      .join("");
    if (!paras && !s.title) return "";
    var alignCls = s.align === "left" ? "hb-left" : s.align === "right" ? "hb-right" : "hb-center";
    return (
      '<section class="section"><div class="wrap"><div class="hb-text ' + alignCls + '">' +
        (s.eyebrow ? '<span class="eyebrow">' + escapeHtml(s.eyebrow) + "</span>" : "") +
        (s.title ? "<h2>" + escapeHtml(s.title) + "</h2>" : "") +
        paras +
      "</div></div></section>"
    );
  }

  /* ---------- image block ---------- */

  function renderImage(s) {
    if (!s.imageUrl) return "";
    var img = '<img src="' + escapeHtml(s.imageUrl) + '" alt="' + escapeHtml(s.imageAlt || s.title || "") + '" loading="lazy">';
    var inner = s.viewAllUrl
      ? '<a href="' + escapeHtml(s.viewAllUrl) + '" class="hb-image-link">' + img + "</a>"
      : img;
    return '<section class="section"><div class="wrap"><div class="hb-image">' + inner + "</div></section>";
  }

  /* ---------- video block ---------- */

  function renderVideo(s) {
    if (!s.videoUrl) return "";
    var attrs = 'src="' + escapeHtml(s.videoUrl) + '"';
    if (s.imageUrl) attrs += ' poster="' + escapeHtml(s.imageUrl) + '"';
    if (s.videoAutoplay !== false) attrs += " autoplay";
    if (s.videoMuted !== false) attrs += " muted";
    if (s.videoLoop !== false) attrs += " loop";
    if (s.videoControls) attrs += " controls";
    attrs += ' playsinline preload="metadata"';
    var inner = '<div class="hb-video"><video ' + attrs + "></video></div>";
    return wrapSection(s, inner, { viewAll: false });
  }

  /* ---------- categories block ---------- */

  var CAT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';

  function renderCategories(s) {
    var items = s.categories || [];
    if (!items.length) return "";
    var cards = items
      .map(function (c) {
        var label = c.count === 1 ? "1 item" : c.count + " items";
        return (
          '<a class="cat-card" href="' + escapeHtml(c.url || ("/shop?cat=" + encodeURIComponent(c.name))) + '">' +
            '<span class="cat-icon">' + CAT_ICON + "</span>" +
            "<h4>" + escapeHtml(c.name) + "</h4>" +
            "<span>" + escapeHtml(label) + "</span>" +
          "</a>"
        );
      })
      .join("");
    return wrapSection(s, '<div class="cat-grid">' + cards + "</div>", { viewAll: false });
  }

  /* ---------- spacer block ---------- */

  function renderSpacer(s) {
    var h = Math.max(8, Math.min(240, Number(s.height) || 48));
    return '<div class="hb-spacer" style="height:' + h + 'px;" aria-hidden="true"></div>';
  }

  /* ---------- dispatch ---------- */

  function renderBlock(s) {
    var t = s.blockType || "products";
    if (t === "banner") return renderBanner(s);
    if (t === "text") return renderText(s);
    if (t === "image") return renderImage(s);
    if (t === "video") return renderVideo(s);
    if (t === "categories") return renderCategories(s);
    if (t === "spacer") return renderSpacer(s);
    return renderProducts(s);
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
        // Permanent hero takeover: a Hero-height banner as the FIRST dashboard
        // block replaces the hardcoded hero (use it for sale campaigns).
        try {
          var firstBlock = sections[0];
          if (firstBlock && firstBlock.blockType === "banner" && firstBlock.bannerHeight === "hero") {
            var heroEl = document.getElementById("site-hero");
            if (heroEl) heroEl.remove();
          }
        } catch (e) {}
        mount.innerHTML = sections.map(renderBlock).join("");
        bindArrows(mount);
      })
      .catch(function (err) {
        console.error("[Hubator] home sections:", err);
        mount.innerHTML = "";
      });
  }

  document.addEventListener("DOMContentLoaded", loadHomeSections);
})();
