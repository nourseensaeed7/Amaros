// supabase/functions/send-contract/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import { esc } from "../_shared/security.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_KEY")!;
// Shared secret the database webhook sends as the "x-webhook-secret" header.
// Without it anyone holding the public anon key could trigger contract emails.
const WEBHOOK_SECRET       = Deno.env.get("WEBHOOK_SECRET");
// ── Brevo (Sendinblue) email ──────────────────────────────────────────────────
// Get a key at Brevo → SMTP & API → API Keys, then add it as a Supabase secret:
//   supabase secrets set BREVO_API_KEY=xkeysib-...
// The sender address MUST be verified in Brevo (Senders, Domains & Dedicated IPs
// → Senders → add + confirm amaros@bluewin.ch) or Brevo refuses to send.
const BREVO_API_KEY        = Deno.env.get("BREVO_API_KEY")!;
const FROM_EMAIL           = Deno.env.get("FROM_EMAIL") ?? "amaros@bluewin.ch";
const FROM_NAME            = Deno.env.get("FROM_NAME")  ?? "Amaros Vermietung";
const OWNER_EMAIL          = Deno.env.get("OWNER_EMAIL") ?? "nourseensaeed7@gmail.com";
const STORAGE_BUCKET       = "contracts";

// ── Per-car contract templates ────────────────────────────────────────────
// Key = vehicle.name exactly as it's stored in the `vehicles` table.
// Value = path of that car's fillable PDF template inside the "contracts" bucket.
// Add/edit entries here whenever you upload a new template.
const TEMPLATES: Record<string, string> = {
  "VW Crafter":  "templates/VW_Crafter_Fahrzeugmietvertrag_fillable.pdf",
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

const fmtDate = (d: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
};

const fmtChf = (n: number | null) =>
  n != null && n > 0 ? `${Number(n).toFixed(2)}` : "-";

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

serve(async (req) => {
  try {
    if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    if (!body.record?.id) {
      return new Response("No reservation data", { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Re-read the row instead of trusting the payload's prices and ids.
    const { data: reservation, error: resError } = await sb
      .from("reservations")
      .select("*")
      .eq("id", body.record.id)
      .single();

    if (resError || !reservation) {
      throw new Error(`Reservation not found: ${resError?.message}`);
    }

    console.log(`Processing reservation: ${reservation.id}`);

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

    const bookingRef = String(reservation.id).padStart(6, "0");
    const done = (body: unknown) =>
      new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

    // UPDATE events: email the customer/owner when the status changes.
    // The statuses come from the webhook payload (old -> new) so a late event
    // can't be mistaken for a newer change; the row data comes from the DB.
    if (body.type === "UPDATE") {
      const from = body.old_record?.contract_status;
      const to   = body.record?.contract_status;
      if (from === to) return done({ skipped: true });
      const sent = await sendStatusEmails(sb, { reservation, customer, vehicle, bookingRef, from, to });
      return done({ success: true, ref: bookingRef, emails: sent });
    }

    // INSERT: generate the (unsigned) contract once. The customer signs it on
    // the website right away; emails go out after signing (UPDATE above).
    if (reservation.contract_status !== "pending") return done({ skipped: true });

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
      // storage-js reports download errors as "{}"; show the HTTP status and body.
      const res = (dlError as { originalError?: unknown } | null)?.originalError;
      const detail = res instanceof Response ? `${res.status} ${await res.text()}` : dlError?.message;
      throw new Error(`Template download failed (${templatePath}): ${detail}`);
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

    // ── 7. Update reservation status (fires an UPDATE event, ignored above) ──
    await sb.from("reservations").update({
      contract_status:  "sent",
      contract_path:    storagePath,
      contract_sent_at: new Date().toISOString(),
    }).eq("id", reservation.id);

    console.log(`✅ Contract generated for reservation #${bookingRef}`);
    return done({ success: true, ref: bookingRef });

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Contract generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ─── Status emails ────────────────────────────────────────────────────────────
// signed_pending_review -> signed copy to customer + owner (owner then sets
//                          contract_status to "confirmed" or "rejected" in Supabase)
// confirmed             -> confirmation with pickup details to the customer
// rejected / cancelled  -> cancellation to the customer, only if they had signed
// Anything else (sent, expired, ...) sends nothing.
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

async function sendStatusEmails(
  // deno-lint-ignore no-explicit-any
  sb: any,
  { reservation, customer, vehicle, bookingRef, from, to }:
    { reservation: Row; customer: Row; vehicle: Row; bookingRef: string; from?: string; to?: string },
): Promise<string[]> {
  const name    = esc(`${customer.first_name} ${customer.last_name}`);
  const summary = detailsTable(reservation, vehicle, bookingRef);

  if (to === "signed_pending_review") {
    const { data: file, error } = await sb.storage.from(STORAGE_BUCKET).download(reservation.signed_contract_path);
    if (error || !file) throw new Error(`Signed contract not found: ${reservation.signed_contract_path}`);
    const attachment = {
      filename: `Mietvertrag_${bookingRef}_unterschrieben.pdf`,
      base64:   toBase64(new Uint8Array(await file.arrayBuffer())),
    };

    await sendEmail({
      to:      customer.email,
      subject: `Ihr unterschriebener Mietvertrag – Buchung #${bookingRef}`,
      html: layout("Vertrag erhalten", `
        <p>Guten Tag <b>${name}</b>,</p>
        <p>vielen Dank! Wir haben Ihren unterschriebenen Mietvertrag erhalten. Eine Kopie finden Sie im Anhang.</p>
        ${summary}
        <p><b>Ihre Buchung ist noch nicht bestätigt.</b> Wir prüfen sie und senden Ihnen die Bestätigung per E-Mail.</p>`),
      attachment,
    });

    await sendEmail({
      to:      OWNER_EMAIL,
      subject: `Neue Buchung unterschrieben – #${bookingRef} bitte bestätigen`,
      html: layout("Neue unterschriebene Buchung", `
        <p><b>${name}</b> hat den Mietvertrag unterschrieben (im Anhang).</p>
        ${summary}
        <p>E-Mail: ${esc(customer.email)}<br>Mobile: ${esc(customer.mobile)}</p>
        <p><b>Bestätigen oder ablehnen:</b> Supabase → Table Editor → reservations → Zeile ${reservation.id}
        → <code>contract_status</code> auf <code>confirmed</code> oder <code>rejected</code> setzen.
        Der Kunde erhält dann automatisch eine E-Mail.</p>`),
      attachment,
    });
    return ["customer:signed", "owner:signed"];
  }

  if (to === "confirmed") {
    await sendEmail({
      to:      customer.email,
      subject: `Ihre Buchung ist bestätigt – #${bookingRef}`,
      html: layout("Buchung bestätigt", `
        <p>Guten Tag <b>${name}</b>,</p>
        <p>Ihre Buchung ist <b>bestätigt</b>. Wir freuen uns auf Sie!</p>
        ${summary}
        <p><b>Abholung:</b> ${fmtDate(reservation.start_date)} ab 08:00 Uhr, Mandachstrasse 50, 8155 Niederhasli (direkt am Bahnhof)<br>
        <b>Rückgabe:</b> ${fmtDate(reservation.end_date)} bis 17:00 Uhr, am selben Ort</p>
        <p>Am Miettag erhalten Sie den Zugangscode für die Schlüsselbox hinter der Fahrertür.
        Bitte bringen Sie Ihren Führerausweis und Ihre ID mit.</p>`),
    });
    return ["customer:confirmed"];
  }

  if ((to === "rejected" || to === "cancelled") &&
      (from === "signed_pending_review" || from === "confirmed")) {
    await sendEmail({
      to:      customer.email,
      subject: `Ihre Buchung #${bookingRef} wurde storniert`,
      html: layout("Buchung storniert", `
        <p>Guten Tag <b>${name}</b>,</p>
        <p>leider können wir Ihre Buchung <b>#${bookingRef}</b> nicht durchführen; sie wurde storniert.
        Bei Fragen erreichen Sie uns jederzeit telefonisch oder per WhatsApp.</p>
        ${summary}`),
    });
    return ["customer:cancelled"];
  }

  return [];
}

function detailsTable(reservation: Row, vehicle: Row, bookingRef: string) {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:5px 10px;font-weight:bold;width:140px;">${label}</td><td style="padding:5px 10px;">${value}</td></tr>`;
  return `<table style="background:#f8f8f8;border-radius:8px;width:100%;margin:16px 0;border-collapse:collapse;">
    ${row("Buchung:", `#${bookingRef}`)}
    ${row("Fahrzeug:", esc(vehicle.name))}
    ${row("Abholdatum:", fmtDate(reservation.start_date))}
    ${row("Rückgabedatum:", fmtDate(reservation.end_date))}
    ${row("Gesamtpreis:", `CHF ${fmtChf(reservation.total_price)}`)}
  </table>`;
}

function layout(title: string, inner: string) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#333;">
      <div style="background:#1a1a2e;color:white;padding:24px 30px;border-radius:10px 10px 0 0;">
        <h2 style="margin:0;">Amaros Fahrzeugvermietung</h2>
        <p style="margin:6px 0 0;color:#aaa;font-size:13px;">${title}</p>
      </div>
      <div style="padding:28px 30px;border:1px solid #eee;border-top:none;border-radius:0 0 10px 10px;">
        ${inner}
        <p style="margin-top:24px;">Telefon/WhatsApp: +41 78 471 16 72 · E-Mail: amaros@bluewin.ch</p>
        <p>Freundliche Grüsse<br><b>Amaros Inh. Soliman</b><br>
        <span style="color:#888;font-size:12px;">Alte Poststrasse 3, 8172 Niederglatt</span></p>
      </div>
    </div>`;
}

// ─── Brevo email helper ───────────────────────────────────────────────────────
// Brevo's transactional endpoint. Unlike Resend's shared test sender, this
// delivers to ANY recipient once FROM_EMAIL is a verified Brevo sender.
// Free tier: ~300 emails/day. Attachment `content` is a base64 string.
async function sendEmail({ to, subject, html, attachment }: {
  to: string;
  subject: string;
  html: string;
  attachment?: { filename: string; base64: string };
}) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key":      BREVO_API_KEY,
      "Content-Type": "application/json",
      "accept":       "application/json",
    },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
      ...(attachment && { attachment: [{ name: attachment.filename, content: attachment.base64 }] }),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email failed (${res.status}): ${err}`);
  }
}