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

// ─── Pricing constants — keep in sync with the labels shown in Form.jsx ───────
const KM_RATE          = 0.60;   // CHF per extra km
const HOUR_RATE        = 20.00;  // CHF per extra hour
const HAFTPFLICHT_FLAT = 12.00;  // CHF, one-time (flat) when selected
const VOLLKASKO_FLAT   = 15.00;  // CHF, one-time (flat) when selected

const round2 = (n: number) => Math.round(n * 100) / 100;

// Clamp a client-supplied quantity to a safe non-negative integer.
const qty = (n: unknown) => {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v > 0 ? v : 0;
};

// Whole days, inclusive of both the pickup and the return day — exactly the
// same formula Form.jsx uses for its on-screen estimate.
function rentalDays(startDate: string, endDate: string): number {
  const diff =
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1;
  return Math.max(1, diff);
}

// The whole price, derived only from the vehicle rate + the reservation inputs.
function computePrice(pricePerDay: unknown, r: Record<string, unknown>) {
  const days       = rentalDays(String(r.start_date), String(r.end_date));
  const ratePerDay = Number(pricePerDay) || 0;
  const basePrice  = ratePerDay * days;

  const kmActive   = !!r.km_active;
  const hourActive = !!r.hour_active;
  const km         = kmActive   ? qty(r.extra_km)    : 0;
  const hours      = hourActive ? qty(r.extra_hours) : 0;

  const extraKmPrice    = round2(km * KM_RATE);
  const extraHoursPrice = round2(hours * HOUR_RATE);
  const haftpflicht     = r.haftpflicht_reduktion ? HAFTPFLICHT_FLAT : 0; // flat, one-time
  const vollkasko       = r.vollkasko_reduktion   ? VOLLKASKO_FLAT   : 0; // flat, one-time

  const extraTotal = round2(extraKmPrice + extraHoursPrice + haftpflicht + vollkasko);
  const totalPrice = round2(basePrice + extraTotal);

  return { days, kmActive, hourActive, km, hours, extraKmPrice, extraHoursPrice, extraTotal, totalPrice };
}

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
    if (new Date(reservation.end_date) < new Date(reservation.start_date)) {
      return json({ error: "Das Rückgabedatum darf nicht vor dem Startdatum liegen." }, 400);
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

    // ── PRICING — the single source of truth ─────────────────────────────
    // The browser sends only the *inputs* (which car, which dates, which
    // extras). Every franc is (re)computed here from the vehicle's own
    // price_per_day, so a client editing the request can't book for CHF 0.
    const { data: vehicle, error: vehicleError } = await sb
      .from("vehicles")
      .select("id, price_per_day")
      .eq("id", Number(reservation.car_id))
      .single();

    if (vehicleError || !vehicle) {
      return json({ error: "Fahrzeug nicht gefunden." }, 404);
    }

    const price = computePrice(vehicle.price_per_day, reservation);

    // ── Insert customer ───────────────────────────────────────────────────
    const { data: newCustomer, error: customerError } = await sb
      .from("customers")
      .insert([customer])
      .select()
      .single();

    if (customerError || !newCustomer) {
      return json({ error: customerError?.message || "Failed to create customer" }, 500);
    }

    // ── Insert reservation (prices from the server, not the client) ───────
    const { data: newReservation, error: reservationError } = await sb
      .from("reservations")
      .insert([{
        customer_id:           newCustomer.id,
        car_id:                Number(reservation.car_id),
        reservation_date:      reservation.reservation_date ?? reservation.start_date,
        start_date:            reservation.start_date,
        end_date:              reservation.end_date,
        haftpflicht_reduktion: !!reservation.haftpflicht_reduktion,
        vollkasko_reduktion:   !!reservation.vollkasko_reduktion,
        km_active:             price.kmActive,
        hour_active:           price.hourActive,
        extra_km:              price.km,
        extra_km_price:        price.extraKmPrice,
        extra_hours:           price.hours,
        extra_hours_price:     price.extraHoursPrice,
        extra_total:           price.extraTotal,
        total_price:           price.totalPrice,
        contract_status:       "pending",
        contract_path:         null,
        signed_contract_path:  null,
        signed_at:             null,
      }])
      .select()
      .single();

    if (reservationError || !newReservation) {
      return json({ error: reservationError?.message || "Failed to create reservation" }, 500);
    }

    return json({ reservationId: newReservation.id, totalPrice: price.totalPrice });

  } catch (err) {
    console.error("create-reservation error:", err);
    return json({ error: String(err) }, 500);
  }
});