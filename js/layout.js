/**
 * Shared storefront header, footer, navigation, and control icons.
 * Page-specific decorative icons are handled by js/page-ui.js.
 */

(function () {
  "use strict";

  const source = document.currentScript
    ? document.currentScript.src
    : new URL("js/layout.js", document.baseURI).href;

  if (!document.getElementById("hubator-responsive-styles")) {
    const stylesheet = document.createElement("link");
    stylesheet.id = "hubator-responsive-styles";
    stylesheet.rel = "stylesheet";
    stylesheet.href = new URL("../css/responsive.css", source).href;
    document.head.appendChild(stylesheet);
  }

  const SVG_NS = "http://www.w3.org/2000/svg";

  const ICONS = {
    home: {
      paths: ["m3 10 9-7 9 7", "M5 9v12h5v-7h4v7h5V9"],
    },
    shop: {
      paths: [
        "M3 9h18l-2-6H5L3 9Z",
        "M3 9v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9",
        "M5 14v7h14v-7",
        "M10 21v-5h4v5",
      ],
    },
    info: {
      paths: ["M12 8h.01", "M12 11v6"],
      circles: [[12, 12, 9]],
    },
    mail: {
      paths: ["M3 5h18v14H3Z", "m3 6 9 7 9-7"],
    },
    help: {
      paths: [
        "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4",
        "M12 17h.01",
      ],
      circles: [[12, 12, 9]],
    },
    user: {
      paths: ["M5 21v-2a7 7 0 0 1 14 0v2"],
      circles: [[12, 7, 4]],
    },
    logout: {
      paths: ["M9 3H4v18h5", "M9 12h12", "m17 8 4 4-4 4"],
    },
    bag: {
      paths: ["M5 7h14l2 14H3L5 7Z", "M9 8V6a3 3 0 0 1 6 0v2"],
    },
    menu: {
      paths: ["M4 6h16", "M4 12h16", "M4 18h16"],
    },
    close: {
      paths: ["m6 6 12 12", "M18 6 6 18"],
    },
    cup: {
      paths: [
        "M3 4h13v10a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V4Z",
        "M16 5h2a3 3 0 0 1 0 6h-2",
        "M2 22h17",
      ],
    },
    shirt: {
      paths: [
        "m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z",
      ],
    },
    truck: {
      paths: ["M1 4h13v13H1Z", "M14 9h4l4 4v4h-8"],
      circles: [[7, 18, 2], [18, 18, 2]],
    },
    return: {
      paths: ["m9 4-6 6 6 6", "M3 10h11a6 6 0 0 1 0 12h-3"],
    },
    shield: {
      paths: [
        "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z",
        "m8 12 3 3 5-6",
      ],
    },
    document: {
      paths: [
        "M14 2H5v20h14V7l-5-5Z",
        "M14 2v5h5",
        "M8 12h8",
        "M8 16h8",
      ],
    },
    plus: {
      paths: ["M12 5v14", "M5 12h14"],
    },
    minus: {
      paths: ["M5 12h14"],
    },
    arrow: {
      paths: ["M4 12h16", "m14 6 6 6-6 6"],
    },
    trash: {
      paths: [
        "M3 6h18",
        "M9 6V3h6v3",
        "M5 6l1 15h12l1-15",
        "M10 10v7",
        "M14 10v7",
      ],
    },
  };

  const NAV_LINKS = [
    { href: "index.html", label: "Home", icon: "home" },
    { href: "shop.html", label: "Shop", icon: "shop" },
    { href: "about.html", label: "About", icon: "info" },
    { href: "contact.html", label: "Contact", icon: "mail" },
    { href: "faq.html", label: "FAQ", icon: "help" },
  ];

  const FOOTER_COLUMNS = [
    {
      heading: "Shop",
      links: [
        { href: "shop.html", label: "All products", icon: "shop" },
        { href: "shop.html?cat=Apparel", label: "Apparel", icon: "shirt" },
        { href: "shop.html?cat=Home", label: "Home", icon: "home" },
        { href: "shop.html?cat=Kitchen", label: "Kitchen", icon: "cup" },
        { href: "shop.html?cat=Accessories", label: "Accessories", icon: "bag" },
      ],
    },
    {
      heading: "Company",
      links: [
        { href: "about.html", label: "About", icon: "info" },
        { href: "contact.html", label: "Contact", icon: "mail" },
        { href: "faq.html", label: "FAQ", icon: "help" },
      ],
    },
    {
      heading: "Account",
      links: [
        { href: "login.html", label: "Sign in", icon: "user" },
        { href: "signup.html", label: "Create account", icon: "user" },
        { href: "cart.html", label: "Cart", icon: "bag" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { href: "privacy-policy.html", label: "Privacy Policy", icon: "shield" },
        { href: "terms-conditions.html", label: "Terms & Conditions", icon: "document" },
        { href: "shipping-policy.html", label: "Shipping Policy", icon: "truck" },
        { href: "refund-policy.html", label: "Refund Policy", icon: "return" },
      ],
    },
  ];

  function make(tag, attrs) {
    const node = document.createElement(tag);

    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    });

    return node;
  }

  function append(parent, ...children) {
    children.forEach((child) => parent.appendChild(child));
    return parent;
  }

  function icon(name) {
    const definition = ICONS[name] || ICONS.info;
    const svg = document.createElementNS(SVG_NS, "svg");

    const attributes = {
      class: "ui-icon",
      viewBox: "0 0 24 24",
      width: "24",
      height: "24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.8",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false",
    };

    Object.entries(attributes).forEach(([key, value]) => {
      svg.setAttribute(key, value);
    });

    definition.paths.forEach((data) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", data);
      svg.appendChild(path);
    });

    (definition.circles || []).forEach(([cx, cy, radius]) => {
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", String(cx));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", String(radius));
      svg.appendChild(circle);
    });

    return svg;
  }

  function labeledLink(href, label, iconName, className = "icon-text-link") {
    return append(
      make("a", { href, class: className }),
      icon(iconName),
      make("span", { text: label })
    );
  }

  function markActive(link, href) {
    const page = location.pathname.split("/").pop() || "index.html";
    const active = page === href || (href === "shop.html" && page === "product.html");

    if (active) link.classList.add("active");
    if (page === href) link.setAttribute("aria-current", "page");
  }

  function navigationList() {
    const list = make("ul");

    NAV_LINKS.forEach(({ href, label, icon: iconName }) => {
      const link = labeledLink(href, label, iconName);
      markActive(link, href);
      append(list, append(make("li"), link));
    });

    return list;
  }

  function buildHeader() {
    const skip = make("a", {
      class: "skip-nav",
      href: "#main-content",
      text: "Skip to main content",
    });
    const logo = make("a", {
      href: "index.html",
      class: "logo",
      text: "Hubator",
      "aria-label": "Hubator home",
    });
    const nav = append(
      make("nav", { class: "main-nav", "aria-label": "Main navigation" }),
      navigationList()
    );

    const signInLink = labeledLink(
      "login.html",
      "Sign in",
      "user",
      "btn btn-outline btn-sm header-signin"
    );

    const userName = make("span", {
      class: "header-user-name",
      "aria-live": "polite",
    });
    const accountLink = labeledLink(
      "account.html",
      "Account",
      "user",
      "header-account-link"
    );
    const signOutButton = append(
      make("button", {
        type: "button",
        class: "btn btn-outline btn-sm header-signout",
      }),
      icon("logout"),
      make("span", { text: "Sign out" })
    );
    signOutButton.addEventListener("click", () => {
      if (typeof signOut === "function") signOut();
    });

    const userMenu = append(
      make("div", { class: "header-user" }),
      userName,
      accountLink,
      signOutButton
    );
    userMenu.style.display = "none";

    const cartLink = append(
      make("a", {
        href: "cart.html",
        class: "icon-link header-cart",
        "aria-label": "Cart",
      }),
      icon("bag"),
      make("span", {
        class: "cart-count",
        "aria-live": "polite",
        "aria-atomic": "true",
        text: "0",
      })
    );

    const toggle = append(
      make("button", {
        type: "button",
        class: "nav-toggle",
        "aria-label": "Open menu",
        "aria-expanded": "false",
        "aria-controls": "mobile-nav",
      }),
      icon("menu")
    );

    const actions = append(
      make("div", { class: "header-actions" }),
      signInLink,
      userMenu,
      cartLink,
      toggle
    );

    const bar = append(
      make("div", { class: "wrap header-bar" }),
      logo,
      nav,
      actions
    );

    return {
      header: append(make("header", { class: "site-header" }), skip, bar),
      drawer: buildMobileNav(toggle),
    };
  }

  function buildMobileNav(toggle) {
    const drawer = make("div", {
      class: "mobile-nav",
      id: "mobile-nav",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Navigation",
      tabindex: "-1",
    });
    drawer.hidden = true;

    const closeButton = append(
      make("button", {
        type: "button",
        class: "mobile-nav-close",
        "aria-label": "Close menu",
      }),
      icon("close")
    );

    const heading = append(
      make("div", { class: "mobile-nav-heading" }),
      make("a", { href: "index.html", class: "logo", text: "Hubator" }),
      closeButton
    );

    const nav = append(
      make("nav", { "aria-label": "Mobile navigation" }),
      navigationList()
    );
    const account = make("div", { class: "mobile-nav-account" });
    const panel = append(
      make("div", { class: "mobile-nav-panel" }),
      heading,
      nav,
      account
    );
    append(drawer, panel);

    let open = false;
    let previouslyFocused = null;
    let backgroundState = [];

    function refreshAccount() {
      account.replaceChildren();

      const signedIn = typeof isSignedIn === "function" && isSignedIn();
      const customer = signedIn && typeof currentCustomer === "function"
        ? currentCustomer()
        : null;

      if (signedIn) {
        if (customer && customer.name) {
          append(account, make("p", {
            class: "mobile-account-name",
            text: "Signed in as " + customer.name,
          }));
        }

        append(
          account,
          labeledLink("account.html", "Account", "user", "btn btn-primary btn-block")
        );

        const button = append(
          make("button", {
            type: "button",
            class: "btn btn-outline btn-block",
          }),
          icon("logout"),
          make("span", { text: "Sign out" })
        );
        button.addEventListener("click", () => {
          closeMenu(false);
          if (typeof signOut === "function") signOut();
        });
        append(account, button);
      } else {
        append(
          account,
          labeledLink("login.html", "Sign in", "user", "btn btn-primary btn-block"),
          labeledLink(
            "signup.html",
            "Create account",
            "user",
            "btn btn-outline btn-block"
          )
        );
      }

      append(
        account,
        labeledLink("cart.html", "View cart", "bag", "btn btn-outline btn-block")
      );
    }

    function closeMenu(restoreFocus = true) {
      if (!open) return;
      open = false;

      backgroundState.forEach(([element, wasInert]) => {
        element.inert = wasInert;
      });
      backgroundState = [];

      drawer.hidden = true;
      drawer.classList.remove("open");
      document.body.classList.remove("nav-drawer-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      toggle.replaceChildren(icon("menu"));

      if (
        restoreFocus &&
        previouslyFocused &&
        previouslyFocused.isConnected &&
        previouslyFocused.getClientRects().length
      ) {
        previouslyFocused.focus();
      }
    }

    function openMenu() {
      if (open) return;

      previouslyFocused = document.activeElement;
      refreshAccount();
      open = true;

      drawer.hidden = false;
      drawer.classList.add("open");
      document.body.classList.add("nav-drawer-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      toggle.replaceChildren(icon("close"));
      closeButton.focus();

      backgroundState = Array.from(document.body.children)
        .filter((element) => (
          element !== drawer &&
          element instanceof HTMLElement &&
          !element.matches("script, style, link")
        ))
        .map((element) => {
          const state = [element, element.inert];
          element.inert = true;
          return state;
        });
    }

    toggle.addEventListener("click", () => {
      if (open) closeMenu();
      else openMenu();
    });
    closeButton.addEventListener("click", () => closeMenu());

    drawer.addEventListener("click", (event) => {
      if (event.target === drawer) closeMenu();
      else if (event.target.closest("a[href]")) closeMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(drawer.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((element) => element.getClientRects().length);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first) {
        event.preventDefault();
        drawer.focus();
      } else if (
        event.shiftKey &&
        (document.activeElement === first || !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener("focusin", (event) => {
      if (open && !drawer.contains(event.target)) closeButton.focus();
    });

    const desktop = window.matchMedia("(min-width: 981px)");
    function onBreakpoint(event) {
      if (event.matches) closeMenu(false);
    }

    if (desktop.addEventListener) {
      desktop.addEventListener("change", onBreakpoint);
    } else {
      desktop.addListener(onBreakpoint);
    }

    return drawer;
  }

  function buildFooter() {
    const brand = append(
      make("div", { class: "footer-brand" }),
      make("a", { href: "index.html", class: "logo", text: "Hubator" }),
      make("p", {
        class: "footer-brand-description",
        text: "Curated apparel & fashion from independent designers.",
      })
    );
    const grid = append(make("div", { class: "footer-grid" }), brand);

    FOOTER_COLUMNS.forEach(({ heading, links }) => {
      const list = make("ul");

      links.forEach(({ href, label, icon: iconName }) => {
        append(list, append(make("li"), labeledLink(href, label, iconName)));
      });

      append(
        grid,
        append(make("div"), make("h5", { text: heading }), list)
      );
    });

    const bottom = append(
      make("div", { class: "footer-bottom" }),
      make("span", {
        text: "\u00A9 " + new Date().getFullYear() + " Hubator. All rights reserved.",
      })
    );

    return append(
      make("footer", { class: "site-footer" }),
      append(make("div", { class: "wrap" }), grid, bottom)
    );
  }

  /*
   * Convert only known controls. Product names, descriptions, prices,
   * user-entered text, and other page content are not rewritten.
   */
  const CONTROL_SELECTOR =
    ".add-btn, .qty-control button, .remove-btn, .pd-actions .btn";

  function enhanceControl(control) {
    if (control.querySelector("svg")) return;

    const text = control.textContent.trim();
    let iconName = null;
    let iconOnly = false;
    let fallbackLabel = text;

    if (control.matches(".add-btn") && text === "+") {
      iconName = "plus";
      iconOnly = true;
      fallbackLabel = "Add to cart";
    } else if (control.matches(".qty-control button")) {
      if (text === "+") {
        iconName = "plus";
        fallbackLabel = "Increase quantity";
      } else if (text === "\u2212" || text === "-") {
        iconName = "minus";
        fallbackLabel = "Decrease quantity";
      }
      iconOnly = true;
    } else if (control.matches(".remove-btn") && text === "Remove") {
      iconName = "trash";
    } else if (control.matches(".pd-actions .btn")) {
      if (text === "Add to cart") iconName = "bag";
      if (text === "Buy now") iconName = "arrow";
    }

    if (!iconName) return;

    if (iconOnly) {
      if (!control.hasAttribute("aria-label")) {
        control.setAttribute("aria-label", fallbackLabel);
      }
      control.replaceChildren(icon(iconName));
    } else {
      control.replaceChildren(icon(iconName), make("span", { text }));
    }
  }

  function enhanceControls(root) {
    if (!root.isConnected) return;

    if (root.nodeType === Node.TEXT_NODE) {
      const control = root.parentElement
        ? root.parentElement.closest(CONTROL_SELECTOR)
        : null;
      if (control) enhanceControl(control);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches("svg, svg *, script, style")) return;

    if (root.matches(CONTROL_SELECTOR)) enhanceControl(root);
    root.querySelectorAll(CONTROL_SELECTOR).forEach(enhanceControl);
  }

  function initialize() {
    const main = document.querySelector("main");
    if (main && !main.id) main.id = "main-content";

    const headerPlaceholder = document.getElementById("site-header");
    if (headerPlaceholder) {
      const { header, drawer } = buildHeader();
      headerPlaceholder.replaceWith(header);
      document.body.prepend(drawer);
    }

    const footerPlaceholder = document.getElementById("site-footer");
    if (footerPlaceholder) footerPlaceholder.replaceWith(buildFooter());

    if (typeof updateHeaderAuth === "function") updateHeaderAuth();
    if (typeof updateCartBadge === "function") updateCartBadge();

    if (main) {
      enhanceControls(main);

      const observer = new MutationObserver((records) => {
        const changed = new Set();

        records.forEach((record) => {
          if (record.type === "characterData") {
            changed.add(record.target);
          } else {
            record.addedNodes.forEach((node) => changed.add(node));
          }
        });

        changed.forEach(enhanceControls);
      });

      observer.observe(main, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
