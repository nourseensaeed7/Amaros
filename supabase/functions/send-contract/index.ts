// supabase/functions/send-contract/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SB_SERVICE_KEY")!;
const RESEND_API_KEY       = Deno.env.get("RESEND_API_KEY")!;
const OWNER_EMAIL          = Deno.env.get("OWNER_EMAIL") ?? "nourseensaeed7@gmail.com";
const TEMPLATE_PATH        = "templates/VW Crafter FahrzeugmietvertragFillable.pdf";
const STORAGE_BUCKET       = "contracts";

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
      .select("*")
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

    // ── 3. Download PDF template ─────────────────────────────────────────────
    const { data: templateData, error: dlError } = await sb.storage
      .from(STORAGE_BUCKET)
      .download(TEMPLATE_PATH);

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

    const fmtDate = (d: string) => {
      if (!d) return "";
      const [y, m, day] = d.split("-");
      return `${day}.${m}.${y}`;
    };

    const fmtChf = (n: number | null) =>
      n != null && n > 0 ? `CHF ${Number(n).toFixed(2)}` : "-";

    const bookingRef = String(reservation.id).padStart(6, "0");

    // ── Contract header ──────────────────────────────────────────────────────
    fill("contract_id",            bookingRef,                              9);

    // ── Customer info ────────────────────────────────────────────────────────
    fill("company",                customer.firma_name          ?? "",      8);
    fill("name",                   customer.last_name           ?? "",      8);
    fill("vorname",                customer.first_name          ?? "",      8);
    fill("id",                     customer.id_passport         ?? "",      8);
    fill("street",                 customer.address             ?? "",      8);
    fill("plz",                    customer.zip                 ?? "",      8);
    fill("stadt",                  customer.resident_country    ?? "",      8);
    fill("gueltig_bis",            fmtDate(customer.license_issue_date),   8);
    fill("tel_nummer",             customer.phone               ?? "",      8);
    fill("mobile",                 customer.mobile              ?? "",      8);
    fill("geburtsdatum",           fmtDate(customer.birthdate),            8);
    fill("fuehrerschein_nr",       customer.license_no          ?? "",      8);
    fill("ausstellungsort",        fmtDate(customer.license_issue_date),   8);
    fill("nationality",            customer.nationality         ?? "",      8);

    // ── Rental period ────────────────────────────────────────────────────────
    fill("abholungsdatum",         fmtDate(reservation.start_date),        8);
    fill("pickup_hr",              "08:00",                                 8);
    fill("rueckgabedatum",         fmtDate(reservation.end_date),          8);
    fill("return_hr",              "17:00",                                 8);

    // ── Costs ────────────────────────────────────────────────────────────────
    fill("no_extra_km",            String(reservation.extra_km    ?? 0),   8);
    fill("extra_km",               fmtChf(reservation.extra_km_price),     8);
    fill("no_extra_hr",            String(reservation.extra_hours ?? 0),   8);
    fill("extra_hour",             fmtChf(reservation.extra_hours_price),  8);
    fill("perm_foriegn",           "-",                                     8);
    fill("foriegn_trip",           "Nein",                                  8);
    fill("reduktion",              reservation.haftpflicht_reduktion ? "CHF 12.00" : "-", 8);
    fill("redu_volkasko",          reservation.vollkasko_reduktion   ? "CHF 15.00" : "-", 8);
    fill("total_price",            fmtChf(reservation.total_price),        8);

    // ── Signatures ───────────────────────────────────────────────────────────
    fill("our_company_es_:sender", "Amaros Inh. Soliman",                  8);
    fill("customer_sign",          "",                                      8);

    // ── 5. Flatten fields (read-only) + save PDF ─────────────────────────────
    form.flatten();
    const filledPdfBytes = await pdfDoc.save();

    // ── 6. Upload filled PDF to Supabase Storage ─────────────────────────────
    const storagePath = `${reservation.id}/Mietvertrag_${bookingRef}.pdf`;

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