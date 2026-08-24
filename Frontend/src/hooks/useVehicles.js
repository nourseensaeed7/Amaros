// src/hooks/useVehicles.js
//
// Replaces the hardcoded `Vehicles` array with a live fetch from Supabase.
// Requires a Supabase client — if you don't already have one, create
// src/lib/supabaseClient.js:
//
//   import { createClient } from "@supabase/supabase-js";
//   export const supabase = createClient(
//     import.meta.env.VITE_SUPABASE_URL,
//     import.meta.env.VITE_SUPABASE_ANON_KEY
//   );

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; 
export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchVehicles() {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("id", { ascending: true });

      if (cancelled) return;

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      // Map DB rows -> the same shape the old hardcoded array used,
      // so the rest of the app (cards, detail pages, etc.) doesn't
      // need to change.
      const mapped = data.map((row) => ({
        id:           row.id,
        name:         row.name,
        price:        row.price_per_day,
        payload:      row.payload,
        fuel:         row.fuel,
        transmission: row.transmission,
        width:        row.width,
        height:       row.height,
        length:       row.length,
        seats:        row.seats,
        image:        row.images ?? [], // array of public Storage URLs, in order
      }));

      setVehicles(mapped);
      setLoading(false);
    }

    fetchVehicles();
    return () => { cancelled = true; };
  }, []);

  return { vehicles, loading, error };
}
