// supabase/functions/send-contract/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_KEY")!;
const RESEND_API_KEY       = Deno.env.get("RESEND_API_KEY")!;
const OWNER_EMAIL          = Deno.env.get("OWNER_EMAIL") ?? "nourseensaeed7@gmail.com";
const STORAGE_BUCKET       = "contracts";

// ── Per-car contract templates ────────────────────────────────────────────
// Key = vehicle.name exactly as it's stored in the `vehicles` table.
// Value = path of that car's fillable PDF template inside the "contracts" bucket.
// Add/edit entries here whenever you upload a new template.
const TEMPLATES: Record<string, string> = {
  "VW Crafter":  "templates/VW Crafter FahrzeugmietvertragFillable.pdf",
  "Iveco Daily": "templates/Iveco_Daily_Fahrzeugmietvertrag_fillable.pdf",
  "MB Sprinter": "templates/MB_Sprinter_Fahrzeugmietvertrag_fillable.pdf",
};

// Turns a vehicle name into a safe, consistent folder name.
// e.g. "VW Crafter" -> "vw-crafter"
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

serve(async (req) => {
  try {
    const body        = await req.json();
    const reservation = body.record;

    if (!reservation?.id) {
      return new Response("No reservation data", { status: 400 });
    }

    console.log(`Processing reservation: ${reservation.id}`);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── 1. Fetch customer ────────────────────────────────────────────────────
    const { data: customer, error: custError } = await sb
      .from("customers")
      .select("*")          // ← back to *, not x
      .eq("id", reservation.customer_id)
      .single();

    if (custError || !customer) {
      throw new Error(`Customer not found: ${custError?.message}`);
    }

    // ── 2. Fetch vehicle ─────────────────────────────────────────────────────
    const { data: vehicle, error: carError } = await sb
      .from("vehicles")
      .select("*")
      .eq("id", reservation.car_id)
      .single();

    if (carError || !vehicle) {
      throw new Error(`Vehicle not found: ${carError?.message}`);
    }

    // ── 3. Pick this car's template and download it ─────────────────────────
    const templatePath = TEMPLATES[vehicle.name];

    if (!templatePath) {
      throw new Error(
        `No contract template configured for vehicle "${vehicle.name}". ` +
        `Add it to the TEMPLATES map in index.ts.`
      );
    }

    const { data: templateData, error: dlError } = await sb.storage
      .from(STORAGE_BUCKET)
      .download(templatePath);

    if (dlError || !templateData) {
      throw new Error(`Template download failed: ${dlError?.message}`);
    }

    const templateBytes = await templateData.arrayBuffer();

    // ── 4. Fill the PDF fields ───────────────────────────────────────────────
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form   = pdfDoc.getForm();

    const fill = (fieldName: string, value: string, fontSize = 8) => {
      try {
        const field = form.getTextField(fieldName);
        field.setText(value ?? "");
        field.setFontSize(fontSize);
      } catch {
        // field not found — skip
      }
    };

    // Sets one half of a Ja/Nein (or similar two-way) checkbox pair.
    const setYesNo = (yesField: string, noField: string, isYes: boolean) => {
      try {
        const yes = form.getCheckBox(yesField);
        isYes ? yes.check() : yes.uncheck();
      } catch {
        // checkbox not found — skip
      }
      try {
        const no = form.getCheckBox(noField);
        !isYes ? no.check() : no.uncheck();
      } catch {
        // checkbox not found — skip
      }
    };

    const fmtDate = (d: string) => {
      if (!d) return "";
      const [y, m, day] = d.split("-");
      return `${day}.${m}.${y}`;
    };

    const fmtChf = (n: number | null) =>
      n != null && n > 0 ? `${Number(n).toFixed(2)}` : "-";

    const bookingRef  = String(reservation.id).padStart(6, "0");
    // No dedicated "protokoll_Nr" column exists yet — reusing bookingRef.
    const protokollNr = bookingRef;

    const rentalDays = (() => {
      if (!reservation.start_date || !reservation.end_date) return "";
      const start = new Date(reservation.start_date);
      const end   = new Date(reservation.end_date);
      const days  = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
      return String(days);
    })();

    // Per-unit rates — must match what Form.jsx uses to compute extra_km_price / extra_hours_price
    const KM_RATE          = 0.60;
    const HOUR_RATE        = 20.00;
    const HAFTPFLICHT_RATE = 12.00; // per day
    const VOLLKASKO_RATE   = 31.00; // per day (always included)
    const SB_VOLLKASKO_RATE = 15.00; // per day

    const days = Number(rentalDays) || 0;
    const grundpreisRate  = vehicle.price_per_day ?? 0;      // CHF per day
    const grundpreisTotal = grundpreisRate * days;            // Grundpreis row total

    // ── Contract header ──────────────────────────────────────────────────────
    fill("protokoll_Nr",              protokollNr,                            9);

    // ── Customer info ────────────────────────────────────────────────────────
    fill("kunde_firma",               customer.firma_name          ?? "",     8);
    fill("kunde_ansprechpartner",     "",                                     8); // no data source yet
    fill("kunde_name",                customer.last_name           ?? "",     8);
    fill("kunde_vorname",             customer.first_name          ?? "",     8);
    fill("kunde_strasse",             customer.address             ?? "",     8);
    fill("kunde_plz",                 customer.zip                 ?? "",     8);
    fill("kunde_ort",                 customer.resident_country    ?? "",     8);
    fill("kunde_fuehrerschein_nr",    customer.license_no          ?? "",     8);
    fill("kunde_mobile",              customer.mobile              ?? "",     8);

    // ── Rental period ────────────────────────────────────────────────────────
    fill("vertrag_datum",             fmtDate(reservation.start_date),        8);
    fill("abholungsdatum",            fmtDate(reservation.start_date),        8);
    fill("abholungszeit_soll",        "08:00",                                8);
    fill("rueckgabedatum",            fmtDate(reservation.end_date),          8);
    fill("rueckgabezeit_soll",        "17:00",                                8);
    fill("abholungsort",              "Niederhasli",                          8);
    fill("rueckgabeort",              "Niederhasli",                          8);
    fill("auslandfahrt",              "Nein",                                 8); // no column yet

    // ── Costs ────────────────────────────────────────────────────────────────
    // Grundpreis = per-day vehicle rate (NOT the total)
    fill("grundpreis_chf",              fmtChf(grundpreisRate),                 8);
    fill("grundpreis_zeile_total_chf",  fmtChf(grundpreisTotal),                8);
    fill("posten_anzahl",               rentalDays,                            8); // Crafter / Iveco
    fill("palettenrolli_anzahl",        rentalDays,                            8); // MB Sprinter (same meaning: rental days)
    fill("inkl_km",                     "-",                                    8); // no column yet
    fill("zusaetzlich_gebucht_km",      String(reservation.extra_km    ?? 0),  8);
    fill("zusaetzlich_gebuchte_stunden", String(reservation.extra_hours ?? 0), 8);

    // Zuschlag pro km / Std — only show a price if the customer actually added it
    fill("zuschlag_pro_km_chf",         reservation.km_active   ? fmtChf(KM_RATE)   : "-", 8);
    fill("zuschlag_pro_km_total_chf",   reservation.km_active   ? fmtChf(reservation.extra_km_price)    : "-", 8);
    fill("zuschlag_pro_std_chf",        reservation.hour_active ? fmtChf(HOUR_RATE) : "-", 8);
    fill("zuschlag_pro_std_total_chf",  reservation.hour_active ? fmtChf(reservation.extra_hours_price) : "-", 8);

    // Selbstbehalt-Reduktionen — rate always shown, total only if selected
    fill("sb_haftpflicht_rate_chf",     fmtChf(HAFTPFLICHT_RATE),               8);
    fill("sb_haftpflicht_total_chf",    reservation.haftpflicht_reduktion ? fmtChf(HAFTPFLICHT_RATE * days) : "-", 8);
    fill("vollkasko_rate_chf",          fmtChf(VOLLKASKO_RATE),                 8); // always included
    fill("sb_vollkasko_rate_chf",       fmtChf(SB_VOLLKASKO_RATE),              8);
    fill("sb_vollkasko_total_chf",      reservation.vollkasko_reduktion ? fmtChf(SB_VOLLKASKO_RATE * days) : "-", 8);

    // Auslandsfahrtbewilligung / Palettenrolli — no reservation column/toggle yet, always "-"
    fill("auslandsfahrtbewilligung_chf",       "-", 8);
    fill("auslandsfahrtbewilligung_total_chf", "-", 8);
    fill("palettenrolli_chf",                  "-", 8);
    fill("palettenrolli_total_chf",            "-", 8);

    fill("bezahlter_betrag_chf",        " 0.00",                             8); // nothing marked as paid yet
    // rabatt_chf intentionally left blank — no discount logic yet

    fill("total_price",                 fmtChf(reservation.total_price),        8); // older templates only
    fill("gesamt_offener_betrag_chf",   fmtChf(reservation.total_price),        8); // current template
    // vollmacht_chf / kaution_chf (Iveco only) intentionally left blank — filled in by staff

    // ── Insurance checkboxes ─────────────────────────────────────────────────
    setYesNo("sb_haftpflicht_ja",     "sb_haftpflicht_nein",  !!reservation.haftpflicht_reduktion);
    setYesNo("sb_vollkasko_ja",       "sb_vollkasko_nein",    !!reservation.vollkasko_reduktion);
    setYesNo("vollkasko_ja",          "vollkasko_nein",       !!reservation.vollkasko);
    setYesNo("versicherung_vollkasko","versicherung_teilkasko", !!reservation.vollkasko);

    // ── Extras (free text, no data source yet) ──────────────────────────────
    fill("kurzbeschreibung_transportgueter", "",                              8);
    fill("geplante_route",                   "",                              8);

    // ── Signature ─────────────────────────────────────────────────────────────
    fill("kunde_unterschrift",        "",                                      8);

    // ── 5. Flatten fields (read-only) + save PDF ─────────────────────────────
    form.flatten();
    const filledPdfBytes = await pdfDoc.save();

    // ── 6. Upload filled PDF to Supabase Storage ─────────────────────────────
    // Layout: contracts/<car-slug>/<protokoll-nr>/Mietvertrag_<ref>.pdf
    const carFolder   = slugify(vehicle.name);
    const storagePath = `${carFolder}/${protokollNr}/Mietvertrag_${bookingRef}.pdf`;

    const { error: uploadError } = await sb.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, filledPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // ── 7. Update reservation status ─────────────────────────────────────────
    await sb.from("reservations").update({
      contract_status:  "sent",
      contract_path:    storagePath,
      contract_sent_at: new Date().toISOString(),
    }).eq("id", reservation.id);

    // ── 8. Convert PDF to base64 for email ───────────────────────────────────
    const uint8Array = new Uint8Array(filledPdfBytes);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const pdfBase64 = btoa(binary);

    const customerName = `${customer.first_name} ${customer.last_name}`;

    // ── 9. Email customer ─────────────────────────────────────────────────────
    await sendEmail({
      to:      customer.email,
      subject: `Ihr Mietvertrag – Ref #${bookingRef} – Bitte unterschreiben`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#333;">
          <div style="background:#1a1a2e;color:white;padding:24px 30px;border-radius:10px 10px 0 0;">
            <h2 style="margin:0;">🚐 Amaros Fahrzeugvermietung</h2>
            <p style="margin:6px 0 0;color:#aaa;font-size:13px;">Ihr Mietvertrag ist bereit</p>
          </div>
          <div style="padding:28px 30px;border:1px solid #eee;border-top:none;border-radius:0 0 10px 10px;">
            <p>Guten Tag <b>${customerName}</b>,</p>
            <p>Im Anhang finden Sie Ihren ausgefüllten Fahrzeugmietvertrag (Ref: <b>#${bookingRef}</b>).</p>
            <table style="background:#f8f8f8;border-radius:8px;padding:14px;width:100%;margin:16px 0;border-collapse:collapse;">
              <tr><td style="padding:5px 10px;font-weight:bold;width:140px;">Fahrzeug:</td>
                  <td style="padding:5px 10px;">${vehicle.name}</td></tr>
              <tr><td style="padding:5px 10px;font-weight:bold;">Abholdatum:</td>
                  <td style="padding:5px 10px;">${fmtDate(reservation.start_date)}</td></tr>
              <tr><td style="padding:5px 10px;font-weight:bold;">Rückgabedatum:</td>
                  <td style="padding:5px 10px;">${fmtDate(reservation.end_date)}</td></tr>
              <tr><td style="padding:5px 10px;font-weight:bold;">Gesamtpreis:</td>
                  <td style="padding:5px 10px;">${fmtChf(reservation.total_price)}</td></tr>
            </table>
            <p><b>Bitte:</b></p>
            <ol>
              <li>Öffnen Sie den angehängten Vertrag</li>
              <li>Lesen Sie ihn sorgfältig durch</li>
              <li>Unterschreiben Sie ihn auf der Website</li>
            </ol>
            <p>📞 078 471 16 72 &nbsp;|&nbsp; ✉️ amaros@bluewin.ch</p>
            <p>Freundliche Grüsse,<br><b>Amaros Inh. Soliman</b></p>
          </div>
        </div>
      `,
      attachment: { filename: `Mietvertrag_${bookingRef}.pdf`, base64: pdfBase64 },
    });

    // ── 10. Notify owner ──────────────────────────────────────────────────────
    await sendEmail({
      to:      OWNER_EMAIL,
      subject: `📋 Neuer Vertrag gesendet – Buchung #${bookingRef}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;">
          <h2>Neuer Mietvertrag gesendet</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px;font-weight:bold;">Buchung:</td><td>#${bookingRef}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Kunde:</td><td>${customerName}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Email:</td><td>${customer.email}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Fahrzeug:</td><td>${vehicle.name}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Zeitraum:</td>
                <td>${fmtDate(reservation.start_date)} → ${fmtDate(reservation.end_date)}</td></tr>
            <tr><td style="padding:6px;font-weight:bold;">Gesamtpreis:</td>
                <td>${fmtChf(reservation.total_price)}</td></tr>
          </table>
          <p style="color:#777;margin-top:20px;">Warten auf Unterschrift des Kunden.</p>
        </div>
      `,
      attachment: { filename: `Mietvertrag_${bookingRef}.pdf`, base64: pdfBase64 },
    });

    console.log(`✅ Contract sent for reservation #${bookingRef}`);
    return new Response(JSON.stringify({ success: true, ref: bookingRef }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ─── Resend email helper ──────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, attachment }: {
  to: string;
  subject: string;
  html: string;
  attachment: { filename: string; base64: string };
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:        "Amaros Vermietung <onboarding@resend.dev>",
      to:          [to],
      subject,
      html,
      attachments: [{ filename: attachment.filename, content: attachment.base64 }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email failed (${res.status}): ${err}`);
  }
}