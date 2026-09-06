/**
 * js/layout.js — Single source of truth for header and footer.
 * Edit NAV_LINKS or FOOTER_COLUMNS here — updates every page instantly.
 */

(function () {

  const NAV_LINKS = [
    { href: "index.html",   label: "Home"    },
    { href: "shop.html",    label: "Shop"    },
    { href: "about.html",   label: "About"   },
    { href: "contact.html", label: "Contact" },
    { href: "faq.html",     label: "FAQ"     },
  ];

  const FOOTER_COLUMNS = [
    {
      heading: "Shop",
      links: [
        { href: "shop.html",                 label: "All products"  },
        { href: "shop.html?cat=Apparel",     label: "Apparel"       },
        { href: "shop.html?cat=Home",        label: "Home"          },
        { href: "shop.html?cat=Kitchen",     label: "Kitchen"       },
        { href: "shop.html?cat=Accessories", label: "Accessories"   },
      ],
    },
    {
      heading: "Company",
      links: [
        { href: "about.html",   label: "About"   },
        { href: "contact.html", label: "Contact" },
        { href: "faq.html",     label: "FAQ"     },
      ],
    },
    {
      heading: "Account",
      links: [
        { href: "login.html",  label: "Sign in"        },
        { href: "signup.html", label: "Create account" },
        { href: "cart.html",   label: "Cart"           },
      ],
    },
    {
      heading: "Legal",
      links: [
        { href: "privacy-policy.html",   label: "Privacy Policy"    },
        { href: "terms-conditions.html", label: "Terms & Conditions" },
        { href: "shipping-policy.html",  label: "Shipping Policy"    },
        { href: "refund-policy.html",    label: "Refund Policy"      },
      ],
    },
  ];

  // Safe DOM element factory — never uses innerHTML
  function make(tag, attrs) {
    const node = document.createElement(tag);
    if (!attrs) return node;
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class")       node.className   = v;
      else if (k === "text")   node.textContent = v;
      else if (k === "style")  node.style.cssText = v;
      else                     node.setAttribute(k, v);
    });
    return node;
  }
  function append(parent, ...children) {
    children.forEach((c) => c && parent.appendChild(c));
    return parent;
  }

  function currentPage() {
    return location.pathname.split("/").pop() || "index.html";
  }
  function isActive(href) {
    const p = currentPage();
    return p === href || (href === "index.html" && (p === "" || p === "/"));
  }

  // ── Header ────────────────────────────────────────────────────────────────

  function buildHeader() {
    // Skip navigation link (accessibility)
    const skip = make("a", { class: "skip-nav", href: "#main-content", text: "Skip to main content" });

    // Logo
    const logo = make("a", { href: "index.html", class: "logo", text: "Hubator" });

    // Desktop nav
    const navUl = make("ul");
    NAV_LINKS.forEach(({ href, label }) => {
      const a = make("a", { href, text: label });
      if (isActive(href)) a.className = "active";
      append(navUl, append(make("li"), a));
    });
    const nav = make("nav", { class: "main-nav", "aria-label": "Main navigation" });
    append(nav, navUl);

    // Sign in / user menu
    const signInLink = make("a", { href: "login.html", class: "btn btn-outline btn-sm header-signin", text: "Sign in" });
    const userName   = make("span", { class: "header-user-name", "aria-live": "polite" });
    const signOutBtn = make("button", { class: "btn btn-outline btn-sm", text: "Sign out", "aria-label": "Sign out" });
    signOutBtn.onclick = () => { if (typeof signOut === "function") signOut(); };
    const userMenu = make("div", { class: "header-user", style: "display:none;align-items:center;gap:0.5rem;" });
    append(userMenu, userName, signOutBtn);

    // Cart
    const cartLink  = make("a", { href: "cart.html", class: "icon-link", "aria-label": "Cart" });
    cartLink.textContent = "🛍️";
    const badge = make("span", { class: "cart-count", "aria-live": "polite", text: "0" });
    append(cartLink, badge);

    const actions = make("div", { class: "header-actions" });
    append(actions, signInLink, userMenu, cartLink);

    // Mobile toggle
    const toggle = make("button", {
      class: "nav-toggle",
      "aria-label": "Open menu",
      "aria-expanded": "false",
      "aria-controls": "mobile-nav",
      text: "☰",
    });

    const bar = make("div", { class: "wrap header-bar" });
    append(bar, logo, nav, actions, toggle);

    const header = make("header", { class: "site-header", role: "banner" });
    append(header, skip, bar);

    // Mobile nav drawer
    const drawer = buildMobileNav(toggle);

    toggle.onclick = () => {
      const open = drawer.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "✕" : "☰";
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    return { header, drawer };
  }

  function buildMobileNav(toggleBtn) {
    const closeBtn = make("button", { class: "mobile-nav-close", "aria-label": "Close menu", text: "✕" });
    const ul = make("ul");
    NAV_LINKS.forEach(({ href, label }) => {
      const a = make("a", { href, text: label });
      if (isActive(href)) a.className = "active";
      append(ul, append(make("li"), a));
    });
    const panel = make("div", { class: "mobile-nav-panel" });
    append(panel, closeBtn, ul);
    const drawer = make("div", {
      class: "mobile-nav",
      id: "mobile-nav",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Navigation",
    });
    append(drawer, panel);

    const close = () => {
      drawer.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "Open menu");
      toggleBtn.textContent = "☰";
    };
    closeBtn.onclick = close;
    drawer.addEventListener("click", (e) => { if (e.target === drawer) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    return drawer;
  }

  // ── Footer ────────────────────────────────────────────────────────────────

  function buildFooter() {
    const brandP = make("p", { text: "Curated everyday goods from independent makers.", style: "margin-top:12px;max-width:32ch;" });
    const brandDiv = make("div");
    append(brandDiv, make("a", { href: "index.html", class: "logo", text: "Hubator" }), brandP);

    const grid = make("div", { class: "footer-grid" });
    append(grid, brandDiv);

    FOOTER_COLUMNS.forEach(({ heading, links }) => {
      const h5 = make("h5", { text: heading });
      const ul = make("ul");
      links.forEach(({ href, label }) => {
        append(ul, append(make("li"), make("a", { href, text: label })));
      });
      const col = make("div");
      append(col, h5, ul);
      append(grid, col);
    });

    const bottom = make("div", { class: "footer-bottom" });
    append(bottom, make("span", { text: "\u00A9 2026 Hubator. All rights reserved." }));

    const wrap = make("div", { class: "wrap" });
    append(wrap, grid, bottom);

    const footer = make("footer", { class: "site-footer", role: "contentinfo" });
    append(footer, wrap);
    return footer;
  }

  // ── Inject ────────────────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    // Give <main> an id for skip-nav target
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";

    // Replace header placeholder
    const hp = document.getElementById("site-header");
    if (hp) {
      const { header, drawer } = buildHeader();
      hp.replaceWith(header);
      document.body.insertBefore(drawer, document.body.firstChild);
    }

    // Replace footer placeholder
    const fp = document.getElementById("site-footer");
    if (fp) fp.replaceWith(buildFooter());

    // Refresh auth state and cart badge after injection
    if (typeof updateHeaderAuth  === "function") updateHeaderAuth();
    if (typeof updateCartBadge   === "function") updateCartBadge();
  });

})();
