// Frontend/src/hooks/useTracking.js
//
// Tracks page views only if the user accepted cookies.
// Call this once in your App.jsx and it tracks automatically
// every time the route changes.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient"; // your existing supabase client

export function useTracking() {
  const location = useLocation();

  useEffect(() => {
    // ── Only track if user accepted cookies ──────────────────────────────────
    const cookieConsent = document.cookie
      .split("; ")
      .find((row) => row.startsWith("CookieConsent="));

    const accepted = cookieConsent?.split("=")?.[1] === "true";
    if (!accepted) return;

    // ── Detect device ────────────────────────────────────────────────────────
    const device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      ? "mobile"
      : "desktop";

    // ── Get country/city from free IP API ────────────────────────────────────
    const track = async () => {
      let country = null;
      let city    = null;

      try {
        const res  = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        country = data.country_name ?? null;
        city    = data.city         ?? null;
      } catch {
        // IP lookup failed — still track without location
      }

      // ── Insert into Supabase ─────────────────────────────────────────────
      await supabase.from("page_views").insert({
        page:     location.pathname || "/",
        device,
        country,
        city,
        referrer: document.referrer || null,
      });
    };

    track();
  }, [location.pathname]); // fires every time the page changes
}