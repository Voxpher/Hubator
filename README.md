# Hubator

A static, no-build ecommerce front-end: home, shop, product detail, cart,
checkout, about, contact, sign in, and sign up — plain HTML/CSS/JS, no
framework, no build step. Cart is stored in the browser (localStorage).

## Files
```
index.html      Home page
shop.html       Product grid with category filters
product.html    Product detail (?id=1..12)
cart.html       Cart, reads/writes localStorage
checkout.html   Checkout form with Razorpay client flow
about.html
contact.html
login.html
signup.html     Customer signup and email verification
css/style.css   All styling
js/products.js  Product catalog (replace with real data or an API call)
js/cart.js      Cart logic + toast notifications
js/checkout.js  Razorpay checkout and guest OTP flow
js/auth.js      Customer auth and session handling
```

## 1. Run it locally
No build tools needed. Either:
- Double-click `index.html`, or
- From this folder, run `python3 -m http.server 8000` and open `http://localhost:8000`

## 2. Push to GitHub
```bash
cd Hubator
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```
(Create the empty repo on github.com first: New repository → don't
initialize with a README, since you already have one.)

## 3. Get a live URL with GitHub Pages
1. On GitHub, open your repo → **Settings** → **Pages**.
2. Under "Build and deployment", set **Source** to `Deploy from a branch`.
3. Branch: `main`, folder: `/ (root)`. Save.
4. Wait ~1 minute, then your site is live at:
   `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`
5. Optional: add a custom domain under the same Pages settings once you own one.

Every time you `git push` again, the live site updates automatically in
about a minute.

## 4. Configure the public API before going live

`js/config.js` contains the public dashboard API base URL. The storefront
uses that API for published products, customer auth, email OTP confirmation,
and Razorpay order creation/verification. Razorpay secret credentials remain
server-side; never put them in this repository or in browser code.

**Product data** (`js/products.js`):
Products are loaded from the public dashboard API. Manage published
products and storefront placements in that dashboard.

## 5. Customize
- Colors, fonts, spacing: `css/style.css`, `:root` block at the top has
  every color/font as a named variable.
- Brand name: search-and-replace "Hubator" across the HTML files.
- Logo: currently text-based (`<a class="logo">`) — swap for an `<img>` if
  you have a logo file.
