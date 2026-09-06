/**
 * js/maintenance.js — Maintenance mode switch.
 *
 * ╔══════════════════════════════════════════════╗
 * ║  TO TURN MAINTENANCE ON:                     ║
 * ║    Set MAINTENANCE_MODE = true               ║
 * ║    Commit and push                           ║
 * ║                                              ║
 * ║  TO TURN MAINTENANCE OFF:                    ║
 * ║    Set MAINTENANCE_MODE = false              ║
 * ║    Commit and push                           ║
 * ╚══════════════════════════════════════════════╝
 */

const MAINTENANCE_MODE = false; // ← CHANGE THIS: true = ON, false = OFF

(function () {
  const page = location.pathname.split("/").pop() || "index.html";

  // Never redirect the maintenance page itself (infinite loop prevention)
  if (page === "maintenance.html") return;

  if (MAINTENANCE_MODE) {
    window.location.replace("maintenance.html");
  }
})();
