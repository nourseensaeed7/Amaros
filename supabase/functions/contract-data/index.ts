// supabase/functions/contract-data/index.ts
//
// Lets the (unauthenticated) SignContract page load a reservation + its
// customer, poll for the generated contract, and mark it as signed —
// without needing public SELECT/UPDATE access on the reservations or
// customers tables. Uses the service role key, same pattern as
// send-contract/index.ts.

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
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, reservationId, signedPath } = await req.json();

    if (!reservationId) {
      return json({ error: "Missing reservationId" }, 400);
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── Load reservation + customer (initial page load) ─────────────────────
    if (action === "load") {
      const { data: reservation, error } = await sb
        .from("reservations")
        .select("*, customers(*)")
        .eq("id", reservationId)
        .single();

      if (error || !reservation) {
        return json({ error: "Buchung nicht gefunden." }, 404);
      }

      return json({ reservation });
    }

    // ── Lightweight poll for contract_path while the PDF is being built ─────
    if (action === "status") {
      const { data, error } = await sb
        .from("reservations")
        .select("contract_path")
        .eq("id", reservationId)
        .single();

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({ contractPath: data?.contract_path ?? null });
    }

    // ── Mark the reservation as signed ───────────────────────────────────────
    if (action === "complete") {
      if (!signedPath) {
        return json({ error: "Missing signedPath" }, 400);
      }

      const { error } = await sb
        .from("reservations")
        .update({
          contract_status:      "signed_pending_review",
          signed_contract_path: signedPath,
          signed_at:            new Date().toISOString(),
        })
        .eq("id", reservationId);

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (err) {
    console.error("contract-data error:", err);
    return json({ error: String(err) }, 500);
  }
});