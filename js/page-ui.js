/**
 * Shared enhancements for existing storefront page templates.
 *
 * Replaces known decorative emoji text with inline SVGs, including
 * asynchronous status messages. User-entered text and order details
 * are excluded from replacement.
 */

(function () {
  "use strict";

  const source = document.currentScript
    ? document.currentScript.src
    : new URL("/js/page-ui.js", document.baseURI).href;

  if (!document.getElementById("hubator-page-ui-styles")) {
    const link = document.createElement("link");
    link.id = "hubator-page-ui-styles";
    link.rel = "stylesheet";
    link.href = new URL("../css/page-ui.css", source).href;
    document.head.appendChild(link);
  }

  const NS = "http://www.w3.org/2000/svg";

  const icons = {
    mail: {
      label: "Email",
      paths: ["M3 5h18v14H3Z", "m3 6 9 7 9-7"],
    },
    phone: {
      label: "Phone",
      paths: [
        "M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z",
      ],
    },
    location: {
      label: "Location",
      paths: [
        "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z",
      ],
      circles: [[12, 10, 3]],
    },
    clock: {
      label: "Hours",
      paths: ["M12 6v6l4 2"],
      circles: [[12, 12, 9]],
    },
    loading: {
      label: "Loading",
      paths: [
        "M6 3h12",
        "M6 21h12",
        "M7 3v4l5 5-5 5v4",
        "M17 3v4l-5 5 5 5v4",
      ],
    },
    success: {
      label: "Yes",
      paths: ["m7 12 3 3 7-7"],
      circles: [[12, 12, 9]],
    },
    error: {
      label: "No",
      paths: ["m8 8 8 8", "m16 8-8 8"],
      circles: [[12, 12, 9]],
    },
    warning: {
      label: "Warning",
      paths: [
        "m12 3 10 18H2L12 3Z",
        "M12 9v5",
        "M12 17h.01",
      ],
    },
    tools: {
      label: "Maintenance",
      paths: [
        "M14 6a6 6 0 0 0-7 7l-4 4a3 3 0 0 0 4 4l4-4a6 6 0 0 0 7-7l-4 3-3-3 3-4Z",
      ],
    },
    bag: {
      label: "Shopping bag",
      paths: [
        "M5 7h14l2 14H3L5 7Z",
        "M9 8V6a3 3 0 0 1 6 0v2",
      ],
    },
    vase: {
      label: "Home",
      paths: [
        "M9 3h6",
        "M10 3v4c0 3-5 5-5 9a7 7 0 0 0 14 0c0-4-5-6-5-9V3",
        "M6 14h12",
      ],
    },
    cup: {
      label: "Kitchen",
      paths: [
        "M3 4h13v10a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V4Z",
        "M16 5h2a3 3 0 0 1 0 6h-2",
        "M2 22h17",
      ],
    },
    shirt: {
      label: "Apparel",
      paths: [
        "m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z",
      ],
    },
    truck: {
      label: "Shipping",
      paths: [
        "M1 4h13v13H1Z",
        "M14 9h4l4 4v4h-8",
      ],
      circles: [[7, 18, 2], [18, 18, 2]],
    },
    return: {
      label: "Replacement",
      paths: ["m9 4-6 6 6 6", "M3 10h11a6 6 0 0 1 0 12h-3"],
    },
    lock: {
      label: "Secure",
      paths: [
        "M5 10h14v11H5Z",
        "M8 10V7a4 4 0 0 1 8 0v3",
        "M12 14v3",
      ],
    },
    arrowLeft: {
      label: "Back",
      paths: ["M20 12H4", "m10 6-6 6 6 6"],
    },
    arrowRight: {
      label: "Continue",
      paths: ["M4 12h16", "m14 6 6 6-6 6"],
    },
  };

  const glyphs = new Map([
    ["\u{1F4E7}", "mail"],
    ["\u{1F4EC}", "mail"],
    ["\u{1F4DE}", "phone"],
    ["\u{1F4CD}", "location"],
    ["\u{1F550}", "clock"],
    ["\u23F3", "loading"],
    ["\u2705", "success"],
    ["\u274C", "error"],
    ["\u26A0", "warning"],
    ["\u{1F527}", "tools"],
    ["\u{1F6CD}", "bag"],
    ["\u{1F45C}", "bag"],
    ["\u{1F3FA}", "vase"],
    ["\u2615", "cup"],
    ["\u{1F455}", "shirt"],
    ["\u{1F69A}", "truck"],
    ["\u21A9", "return"],
    ["\u{1F512}", "lock"],
    ["\u2713", "success"],
    ["\u2714", "success"],
    ["\u2190", "arrowLeft"],
    ["\u2192", "arrowRight"],
  ]);

  const pattern = new RegExp(
    "(" + Array.from(glyphs.keys()).join("|") + ")[\\uFE0E\\uFE0F]?",
    "gu"
  );

  const excluded = [
    "script",
    "style",
    "svg",
    "textarea",
    "input",
    "select",
    "option",
    "pre",
    "code",
    "[contenteditable]",
    "[data-preserve-text]",
    ".header-user-name",
    ".mobile-account-name",
    ".product-card",
    ".pd-info",
    ".cl-meta",
    ".cart-line h4",
    "#conf-items",
    "#conf-address",
    "#conf-email",
    "#conf-order-number",
    "#conf-totals",
    "#checkout-summary",
    "#signup-description",
    '[role="alert"]',
  ].join(", ");

  function createIcon(name, exposeLabel) {
    const definition = icons[name];
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "page-icon page-icon--" + name);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("focusable", "false");

    if (exposeLabel) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", definition.label);
    } else {
      svg.setAttribute("aria-hidden", "true");
    }

    definition.paths.forEach((data) => {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", data);
      svg.appendChild(path);
    });

    (definition.circles || []).forEach(([cx, cy, radius]) => {
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", String(cx));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", String(radius));
      svg.appendChild(circle);
    });

    return svg;
  }

  function replaceText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(excluded)) return;

    const text = node.nodeValue || "";
    pattern.lastIndex = 0;
    if (!pattern.test(text)) return;
    pattern.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > cursor) {
        fragment.appendChild(
          document.createTextNode(text.slice(cursor, match.index))
        );
      }

      const name = glyphs.get(match[1]);

      // FAQ yes/no markers convey meaning rather than decoration alone.
      const exposeLabel = Boolean(
        parent.closest(".page-faq") &&
        (name === "success" || name === "error")
      );

      fragment.appendChild(createIcon(name, exposeLabel));
      cursor = match.index + match[0].length;
    }

    if (cursor < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(cursor)));
    }

    node.replaceWith(fragment);
  }

  function enhance(root) {
    if (!root.isConnected) return;

    if (root.nodeType === Node.TEXT_NODE) {
      replaceText(root);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(excluded)) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceText);
  }

  function preparePage() {
    const name = (location.pathname.replace(/^\/|\/$/g, "") || "home").replace(/\.html$/, "");
    document.body.classList.add("page-ui", "page-" + name);

    const authPages = [
      "login",
      "signup",
      "forgot-password",
      "reset-password",
      "verify-email",
    ];
    const articlePages = [
      "faq",
      "privacy-policy",
      "refund-policy",
      "shipping-policy",
      "terms-conditions",
    ];

    if (authPages.includes(name)) document.body.classList.add("page-auth");

    if (articlePages.includes(name)) {
      document.body.classList.add("page-article");
      document.querySelectorAll("main > .section > .wrap").forEach((element) => {
        element.classList.add("article-content");
      });
    }

    if (name === "order-confirmation") {
      const payment = document.getElementById("conf-payment");
      const columns = payment && payment.parentElement.parentElement;
      if (columns) columns.classList.add("confirmation-columns");
    }

    const otp = document.getElementById("otp-input");
    const otpLabel = document.querySelector("#otp-box > label");
    if (otp && otpLabel) otpLabel.setAttribute("for", otp.id);

    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";

    enhance(document.body);

    const observer = new MutationObserver((records) => {
      const changed = new Set();

      records.forEach((record) => {
        if (record.type === "characterData") {
          changed.add(record.target);
        } else {
          record.addedNodes.forEach((node) => changed.add(node));
        }
      });

      changed.forEach(enhance);
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preparePage, { once: true });
  } else {
    preparePage();
  }
})();
