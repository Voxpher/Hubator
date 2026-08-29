/* =========================================================
   AUTH INTEGRATION POINT
   -----------------------------------------------------------
   No backend is included in this template, so login/signup
   forms are currently visual only. Easiest options for a
   static site like this one:

   - Supabase Auth (free tier, easy email+Google login)
   - Firebase Authentication (free tier, same idea)
   - Auth0 (more setup, more enterprise features)

   All three give you a small JS snippet + a public/anon key
   (safe to expose in front-end code, unlike a secret key).
   Paste that snippet here, then call its sign-in/sign-up
   functions from the forms in login.html / signup.html.
   ========================================================= */

const AUTH_PUBLIC_KEY = ""; // e.g. your Supabase anon key or Firebase apiKey
const AUTH_PROJECT_URL = ""; // e.g. your Supabase project URL

// Example shape once wired up:
// async function signIn(email, password){ ... }
// async function signUp(email, password){ ... }
