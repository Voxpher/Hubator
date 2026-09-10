/**
 * js/maintenance.js
 *
 * Set MAINTENANCE_MODE to true to redirect visitors to maintenance.html.
 * Set it to false to restore the storefront.
 *
 * Also loads shared page UI enhancements. Keeping the enhancement
 * implementation separate avoids duplicating it across HTML pages.
 */

const MAINTENANCE_MODE = false;

(function () {
  "use strict";

  const legacyRoutes = {
    "index.html": "/",
    "shop.html": "/shop",
    "product.html": "/product",
    "about.html": "/about",
    "contact.html": "/contact",
    "faq.html": "/faq",
    "account.html": "/account",
    "cart.html": "/cart",
    "checkout.html": "/checkout",
    "login.html": "/login",
    "signup.html": "/signup",
    "forgot-password.html": "/forgot-password",
    "reset-password.html": "/reset-password",
    "verify-email.html": "/verify-email",
    "order-confirmation.html": "/order-confirmation",
    "privacy-policy.html": "/privacy-policy",
    "terms-conditions.html": "/terms-conditions",
    "shipping-policy.html": "/shipping-policy",
    "refund-policy.html": "/refund-policy",
    "maintenance.html": "/maintenance",
  };
  const page = location.pathname.replace(/\/$/, "") || "/";
  const legacyName = location.pathname.split("/").pop().toLowerCase();
  if (legacyRoutes[legacyName]) {
    window.location.replace(legacyRoutes[legacyName] + location.search + location.hash);
    return;
  }

  const canonical = document.querySelector('link[rel="canonical"]') || document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = new URL(location.pathname.replace(/\/$/, "") || "/", location.origin).href;
  if (!canonical.parentNode) document.head.appendChild(canonical);

  if (MAINTENANCE_MODE && page !== "/maintenance") {
    window.location.replace("/maintenance");
    return;
  }

  if (document.getElementById("hubator-page-ui-script")) return;

  const source = document.currentScript
    ? document.currentScript.src
    : new URL("/js/maintenance.js", document.baseURI).href;

  const script = document.createElement("script");
  script.id = "hubator-page-ui-script";
  script.src = new URL("page-ui.js", source).href;
  script.async = true;
  document.head.appendChild(script);
})();
