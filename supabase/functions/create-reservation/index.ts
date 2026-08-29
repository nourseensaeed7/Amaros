// supabase/functions/create-reservation/index.ts
//
// Performs the customer + reservation inserts server-side using the
// service role key. This avoids the anon RLS/RETURNING conflict (Postgres
// requires SELECT permission to return a row after INSERT, and anon has
// none on these tables by design) and adds real server-side validation,
// so a malicious client can't bypass the React form's checks.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { customer, reservation } = await req.json();

    if (!customer || !reservation) {
      return json({ error: "Missing customer or reservation data" }, 400);
    }

    // ── Basic server-side validation ─────────────────────────────────────
    const requiredCustomerFields = [
      "first_name", "last_name", "email", "mobile",
      "resident_country", "license_no",
      "license_front_path", "license_back_path",
      "id_front_path", "id_back_path",
      "address", "zip",
    ];
    for (const field of requiredCustomerFields) {
      if (!customer[field]) {
        return json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    if (!reservation.car_id || !reservation.start_date || !reservation.end_date) {
      return json({ error: "Missing required reservation fields" }, 400);
    }

    // Re-check the 25-year-old minimum age server-side (don't trust the client)
    if (!customer.birthdate) {
      return json({ error: "Missing birthdate" }, 400);
    }
    const birth = new Date(customer.birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 25) {
      return json({ error: "Der Fahrer muss mindestens 25 Jahre alt sein." }, 400);
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── Insert customer ───────────────────────────────────────────────────
    const { data: newCustomer, error: customerError } = await sb
      .from("customers")
      .insert([customer])
      .select()
      .single();

    if (customerError || !newCustomer) {
      return json({ error: customerError?.message || "Failed to create customer" }, 500);
    }

    // ── Insert reservation ────────────────────────────────────────────────
    const { data: newReservation, error: reservationError } = await sb
      .from("reservations")
      .insert([{ ...reservation, customer_id: newCustomer.id }])
      .select()
      .single();

    if (reservationError || !newReservation) {
      return json({ error: reservationError?.message || "Failed to create reservation" }, 500);
    }

    return json({ reservationId: newReservation.id });

  } catch (err) {
    console.error("create-reservation error:", err);
    return json({ error: String(err) }, 500);
  }
});