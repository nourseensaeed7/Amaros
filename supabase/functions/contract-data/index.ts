// supabase/functions/contract-data/index.ts
//
// Lets the (unauthenticated) SignContract page load a reservation + its
// customer, poll for the generated contract, and mark it as signed —
// without needing public SELECT/UPDATE access on the reservations or
// customers tables, or any public access to the "contracts" bucket.
// Uses the service role key, same pattern as send-contract/index.ts.
//
// Every action requires the booking token that create-reservation returned,
// so knowing (or guessing) a reservation id alone is not enough.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { verifyBookingToken, signedContractPath } from "../_shared/security.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_KEY")!;
const STORAGE_BUCKET       = "contracts";

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
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, reservationId, token } = await req.json();
    const id = Number(reservationId);

    if (!Number.isInteger(id) || id <= 0 || !(await verifyBookingToken(SUPABASE_SERVICE_KEY, id, token))) {
      return json({ error: "Buchung nicht gefunden." }, 404);
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Short-lived download link for the generated contract, once it exists.
    const contractUrl = async (path: string | null) => {
      if (!path) return null;
      const { data } = await sb.storage.from(STORAGE_BUCKET).createSignedUrl(path, 3600);
      return data?.signedUrl ?? null;
    };

    // ── Load reservation + customer name (initial page load) ────────────────
    if (action === "load") {
      const { data: reservation, error } = await sb
        .from("reservations")
        .select("id, start_date, end_date, contract_path, contract_status, customers(first_name, last_name)")
        .eq("id", id)
        .single();

      if (error || !reservation) {
        return json({ error: "Buchung nicht gefunden." }, 404);
      }

      const { contract_path, ...rest } = reservation;
      return json({ reservation: rest, contractUrl: await contractUrl(contract_path) });
    }

    // ── Lightweight poll while the PDF is being built ────────────────────────
    if (action === "status") {
      const { data, error } = await sb
        .from("reservations")
        .select("contract_path")
        .eq("id", id)
        .single();

      if (error) {
        console.error("contract-data status error:", error);
        return json({ error: "Status konnte nicht geladen werden." }, 500);
      }

      return json({ contractUrl: await contractUrl(data?.contract_path ?? null) });
    }

    // Signing is only allowed once, after send-contract generated the PDF.
    const { data: current } = await sb
      .from("reservations")
      .select("contract_status, hold_expires_at")
      .eq("id", id)
      .single();

    // The cron job marks old holds "expired" every 5 minutes; check the time too.
    if (current?.hold_expires_at && new Date(current.hold_expires_at) < new Date()) {
      return json({ error: "Die Reservierung ist abgelaufen (2 Stunden). Bitte buchen Sie erneut." }, 409);
    }
    if (current?.contract_status !== "sent") {
      return json({ error: "Dieser Vertrag kann nicht mehr unterschrieben werden." }, 409);
    }

    const signedPath = signedContractPath(id);

    // ── One-time upload URL for the signed PDF (path fixed by the server) ───
    if (action === "upload-url") {
      const { data, error } = await sb.storage
        .from(STORAGE_BUCKET)
        .createSignedUploadUrl(signedPath, { upsert: true });

      if (error || !data) {
        console.error("contract-data upload-url error:", error);
        return json({ error: "Upload fehlgeschlagen." }, 500);
      }

      return json({ path: data.path, uploadToken: data.token });
    }

    // ── Mark the reservation as signed ───────────────────────────────────────
    if (action === "complete") {
      const { error } = await sb
        .from("reservations")
        .update({
          contract_status:      "signed_pending_review",
          signed_contract_path: signedPath,
          signed_at:            new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("contract-data complete error:", error);
        return json({ error: "Fehler beim Aktualisieren der Buchung." }, 500);
      }

      return json({ success: true, signedUrl: await contractUrl(signedPath) });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("contract-data error:", err);
    return json({ error: "Interner Fehler." }, 500);
  }
});
