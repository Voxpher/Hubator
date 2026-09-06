/**
 * js/layout.js — Single source of truth for header and footer.
 *
 * Edit the nav links or footer columns HERE ONLY.
 * Every page loads this file, so changes appear everywhere instantly.
 *
 * Pages mark their active nav link with data-page="pagename" on <body>.
 */

(function () {
  // ─── NAV LINKS ────────────────────────────────────────────────────────────
  // Add, remove, or reorder links here — applies to ALL pages automatically.
  const NAV_LINKS = [
    { href: "index.html",   label: "Home"    },
    { href: "shop.html",    label: "Shop"    },
    { href: "about.html",   label: "About"   },
    { href: "contact.html", label: "Contact" },
    { href: "faq.html",     label: "FAQ"     },
  ];

  // ─── FOOTER COLUMNS ───────────────────────────────────────────────────────
  const FOOTER_COLUMNS = [
    {
      heading: "Shop",
      links: [
        { href: "shop.html",              label: "All products"  },
        { href: "shop.html?cat=Apparel",  label: "Apparel"       },
        { href: "shop.html?cat=Home",     label: "Home"          },
        { href: "shop.html?cat=Kitchen",  label: "Kitchen"       },
        { href: "shop.html?cat=Accessories", label: "Accessories" },
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
        { href: "login.html",  label: "Sign in"       },
        { href: "signup.html", label: "Create account" },
        { href: "cart.html",   label: "Cart"           },
      ],
    },
    {
      heading: "Legal",
      links: [
        { href: "privacy-policy.html",   label: "Privacy Policy"      },
        { href: "terms-conditions.html", label: "Terms & Conditions"   },
        { href: "shipping-policy.html",  label: "Shipping Policy"      },
        { href: "refund-policy.html",    label: "Refund Policy"        },
      ],
    },
  ];

  // ─── Detect active page ───────────────────────────────────────────────────
  function currentPage() {
    const path = location.pathname.split("/").pop() || "index.html";
    return path || "index.html";
  }

  // ─── Build header HTML ────────────────────────────────────────────────────
  function buildHeader() {
    const page = currentPage();
    const navItems = NAV_LINKS.map(({ href, label }) => {
      const active = page === href || (href === "index.html" && page === "") ? ' class="active"' : "";
      return `<li><a href="${href}"${active}>${label}</a></li>`;
    }).join("\n        ");

    return `
<header class="site-header">
  <div class="wrap header-bar">
    <a href="index.html" class="logo">Hubator</a>
    <nav class="main-nav">
      <ul>
        ${navItems}
      </ul>
    </nav>
    <div class="header-actions">
      <a href="login.html" class="btn btn-outline btn-sm header-signin">Sign in</a>
      <div class="header-user" style="display:none;align-items:center;gap:0.5rem;">
        <span class="header-user-name" style="font-size:0.88rem;font-weight:600;color:#1f2937;"></span>
        <button onclick="signOut()" class="btn btn-outline btn-sm" style="padding:0.25rem 0.75rem;font-size:0.8rem;">Sign out</button>
      </div>
      <a href="cart.html" class="icon-link" aria-label="Cart">&#128717;<span class="cart-count">0</span></a>
    </div>
    <button class="nav-toggle" aria-label="Menu">&#9776;</button>
  </div>
</header>`.trim();
  }

  // ─── Build footer HTML ────────────────────────────────────────────────────
  function buildFooter() {
    const cols = FOOTER_COLUMNS.map(({ heading, links }) => {
      const items = links.map(({ href, label }) =>
        `<li><a href="${href}">${label}</a></li>`
      ).join("\n          ");
      return `
      <div>
        <h5>${heading}</h5>
        <ul>
          ${items}
        </ul>
      </div>`;
    }).join("");

    return `
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a href="index.html" class="logo">Hubator</a>
        <p style="margin-top:12px;max-width:32ch;">Curated everyday goods from independent makers.</p>
      </div>${cols}
    </div>
    <div class="footer-bottom">
      <span>&#169; 2026 Hubator. All rights reserved.</span>
    </div>
  </div>
</footer>`.trim();
  }

  // ─── Inject on DOMContentLoaded ───────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    // Inject header
    const headerEl = document.getElementById("site-header");
    if (headerEl) headerEl.outerHTML = buildHeader();

    // Inject footer
    const footerEl = document.getElementById("site-footer");
    if (footerEl) footerEl.outerHTML = buildFooter();

    // Re-run auth header update after header is injected
    if (typeof updateHeaderAuth === "function") updateHeaderAuth();
  });
})();
