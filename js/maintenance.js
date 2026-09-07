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

  const page = location.pathname.split("/").pop() || "index.html";

  if (MAINTENANCE_MODE && page !== "maintenance.html") {
    window.location.replace("maintenance.html");
    return;
  }

  if (document.getElementById("hubator-page-ui-script")) return;

  const source = document.currentScript
    ? document.currentScript.src
    : new URL("js/maintenance.js", document.baseURI).href;

  const script = document.createElement("script");
  script.id = "hubator-page-ui-script";
  script.src = new URL("page-ui.js", source).href;
  script.async = true;
  document.head.appendChild(script);
})();
