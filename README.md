# EcommerceHubator

A static, no-build ecommerce front-end: home, shop, product detail, cart,
checkout, about, contact, sign in, and sign up — plain HTML/CSS/JS, no
framework, no build step. Cart is stored in the browser (localStorage).

## Files
```
index.html      Home page
shop.html       Product grid with category filters
product.html    Product detail (?id=1..12)
cart.html       Cart, reads/writes localStorage
checkout.html   Checkout form (payment not wired up yet — see below)
about.html
contact.html
login.html
signup.html     (auth not wired up yet — see below)
css/style.css   All styling
js/products.js  Product catalog (replace with real data or an API call)
js/cart.js      Cart logic + toast notifications
js/checkout.js  Payment integration point
js/auth.js      Auth integration point
```

## 1. Run it locally
No build tools needed. Either:
- Double-click `index.html`, or
- From this folder, run `python3 -m http.server 8000` and open `http://localhost:8000`

## 2. Push to GitHub
```bash
cd ecommercehubator
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

## 4. Replace the placeholder keys before going live

**Payments** (`js/checkout.js`):
This is a static site, so it can't charge cards by itself. Pick one:
- **Fastest, no code:** create a Stripe Payment Link in your Stripe
  Dashboard, then set `STRIPE_PAYMENT_LINK` in `js/checkout.js`.
- **Custom cart at checkout:** deploy a small serverless function
  (Vercel/Netlify/Supabase Edge Function) that creates a Stripe Checkout
  Session using your **secret** key (never put the secret key in this
  front-end code), and set `STRIPE_SESSION_ENDPOINT` in `js/checkout.js`
  to that function's URL.

**Login/signup** (`js/auth.js`):
Forms are visual only right now. Wire up Supabase Auth or Firebase
Authentication (both have a generous free tier and work well with a
static site) — paste their project URL/public key into `js/auth.js` and
connect the sign-in/sign-up calls from `login.html` / `signup.html`.

**Product data** (`js/products.js`):
Replace the sample array with your real products, or point the site at
a real backend/database and fetch the list instead.

## 5. Customize
- Colors, fonts, spacing: `css/style.css`, `:root` block at the top has
  every color/font as a named variable.
- Brand name: search-and-replace "EcommerceHubator" across the HTML files.
- Logo: currently text-based (`<a class="logo">`) — swap for an `<img>` if
  you have a logo file.
