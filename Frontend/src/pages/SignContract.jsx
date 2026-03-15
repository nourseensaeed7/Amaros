// Frontend/src/pages/SignContract.jsx

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { PDFDocument, rgb } from "pdf-lib";
import Nav from "../components/Nav";
import Footer from "../components/Footer.jsx";

const WHATSAPP_NUMBER = "41784711672"; // +41 78 471 16 72

export default function SignContract() {
  const location      = useLocation();
  const navigate      = useNavigate();
  const reservationId = location.state?.reservationId;

  const [pdfUrl,      setPdfUrl]      = useState(null);
  const [pdfBytes,    setPdfBytes]    = useState(null);
  const [reservation, setReservation] = useState(null);
  const [customer,    setCustomer]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [loadingMsg,  setLoadingMsg]  = useState("Vertrag wird erstellt...");
  const [signing,     setSigning]     = useState(false);
  const [signed,      setSigned]      = useState(false);
  const [agreed,      setAgreed]      = useState(false);
  const [error,       setError]       = useState(null);
  const [hasDrawn,    setHasDrawn]    = useState(false);
  const [signedUrl,   setSignedUrl]   = useState(null); // ← download link after signing

  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });

  // ── Load contract from Supabase ───────────────────────────────────────────
  useEffect(() => {
    if (!reservationId) {
      setError("Keine Buchungs-ID gefunden.");
      setLoading(false);
      return;
    }
    loadContract();
  }, [reservationId]);

  const loadContract = async () => {
    try {
      const { data: res } = await supabase
        .from("reservations")
        .select("*, customers(*)")
        .eq("id", reservationId)
        .single();

      if (!res) throw new Error("Buchung nicht gefunden.");
      setReservation(res);
      setCustomer(res.customers);

      // Poll until Edge Function generates the PDF (max 30s)
      let contractPath = res.contract_path;
      let attempts = 0;

      while (!contractPath && attempts < 15) {
        setLoadingMsg(`Vertrag wird erstellt... (${attempts + 1}/15)`);
        await new Promise((r) => setTimeout(r, 2000));
        const { data: updated } = await supabase
          .from("reservations")
          .select("contract_path")
          .eq("id", reservationId)
          .single();
        contractPath = updated?.contract_path;
        attempts++;
        console.log(`Attempt ${attempts}: contract_path = ${contractPath}`);
      }

      if (!contractPath)
        throw new Error("Vertrag konnte nicht erstellt werden. Bitte kontaktieren Sie uns.");

      setLoadingMsg("PDF wird geladen...");

      // Get signed URL for PDF (valid 1 hour)
      const { data: urlData, error: urlError } = await supabase.storage
        .from("contracts")
        .createSignedUrl(contractPath, 3600);

      console.log("contractPath:", contractPath);
      console.log("urlData:", urlData);
      console.log("urlError:", urlError);

      if (!urlData?.signedUrl)
        throw new Error("PDF konnte nicht geladen werden.");

      // Download PDF bytes for signing
      const response = await fetch(urlData.signedUrl);
      const bytes    = await response.arrayBuffer();

      setPdfUrl(urlData.signedUrl);
      setPdfBytes(bytes);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // ── Canvas setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#44200a";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
  }, [pdfUrl]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches)
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    isDrawing.current = true;
    lastPos.current   = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // ── Submit signature ──────────────────────────────────────────────────────
  const handleSign = async () => {
    if (!hasDrawn || !agreed) return;
    setSigning(true);
    setError(null);

    try {
      const canvas     = canvasRef.current;
      const sigDataUrl = canvas.toDataURL("image/png");
      const sigBase64  = sigDataUrl.split(",")[1];
      const sigBytes   = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));

      const pdfDoc   = await PDFDocument.load(pdfBytes);
      const sigImage = await pdfDoc.embedPng(sigBytes);
      const pages    = pdfDoc.getPages();

      // ✅ FIX: Place signature on PAGE 1 in exact field position
      // PDF field rect: [445.56, 70.66, 595.56, 92.66]
      const firstPage = pages[0];
      firstPage.drawImage(sigImage, {
        x:      445.56,
        y:      70.66,
        width:  150,
        height: 22,
      });

      // Add timestamp below signature
      firstPage.drawText(
        `${new Date().toLocaleDateString("de-CH")} ${new Date().toLocaleTimeString("de-CH")}`,
        { x: 445.56, y: 62, size: 6, color: rgb(0.5, 0.5, 0.5) }
      );

      const signedPdfBytes = await pdfDoc.save();
      const bookingRef     = String(reservationId).padStart(6, "0");
      const signedPath     = `${reservationId}/Mietvertrag_${bookingRef}_signed.pdf`;

      // Upload signed PDF
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(signedPath, signedPdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw new Error("Upload fehlgeschlagen.");

      // Update reservation status
      await supabase.from("reservations").update({
        contract_status:      "signed_pending_review",
        signed_contract_path: signedPath,
        signed_at:            new Date().toISOString(),
      }).eq("id", reservationId);

      // ✅ Generate download URL for the signed PDF
      const { data: signedUrlData } = await supabase.storage
        .from("contracts")
        .createSignedUrl(signedPath, 3600);

      if (signedUrlData?.signedUrl) {
        setSignedUrl(signedUrlData.signedUrl);
      }

      setSigned(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  };

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const openWhatsApp = () => {
    const bookingRef = String(reservationId).padStart(6, "0");
    const name       = `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim();
    const message    = encodeURIComponent(
      `Guten Tag,\n\n` +
      `ich habe den Mietvertrag #${bookingRef} unterschrieben.\n\n` +
      `Name: ${name}\n` +
      `Abholdatum: ${reservation?.start_date ?? ""}\n` +
      `Rückgabedatum: ${reservation?.end_date ?? ""}\n\n` +
      `Der unterschriebene Vertrag ist in Ihrem System gespeichert.\n` +
      `Bitte bestätigen Sie meine Buchung.\n\nVielen Dank!`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col bg-yellow-400/5">
      <Nav />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-12 h-12 border-4 border-yellow-900/20 border-t-yellow-900 rounded-full animate-spin" />
        <p className="text-yellow-900 font-semibold text-lg">{loadingMsg}</p>
        <p className="text-yellow-900/60 text-sm text-center max-w-xs">
          Bitte warten Sie, schließen Sie diese Seite nicht.
          Dies kann bis zu 30 Sekunden dauern.
        </p>
      </div>
      <Footer />
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && !pdfUrl) return (
    <div className="min-h-screen flex flex-col bg-yellow-400/5">
      <Nav />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600 text-base text-center">⚠️ {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-yellow-900 text-white px-6 py-2 rounded-lg hover:bg-yellow-800 transition"
        >
          Zurück zum Formular
        </button>
      </div>
      <Footer />
    </div>
  );

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-yellow-400/5">
      <Nav />

      <div className="flex flex-col gap-5 m-5 md:m-10 max-w-3xl mx-auto w-full pt-15">

        {/* ── Booking Summary ── */}
        <div className="border-2 rounded-lg bg-yellow-400/5 border-yellow-900/5 p-5">
          <h2 className="text-xl font-semibold text-yellow-900 mb-3">
            Buchungsübersicht
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-yellow-900/50 text-xs uppercase tracking-wide">Buchung</p>
              <p className="font-bold text-yellow-900">#{String(reservationId).padStart(6, "0")}</p>
            </div>
            <div>
              <p className="text-yellow-900/50 text-xs uppercase tracking-wide">Kunde</p>
              <p className="font-semibold text-yellow-900">{customer?.first_name} {customer?.last_name}</p>
            </div>
            <div>
              <p className="text-yellow-900/50 text-xs uppercase tracking-wide">Abholdatum</p>
              <p className="font-semibold text-yellow-900">{reservation?.start_date}</p>
            </div>
            <div>
              <p className="text-yellow-900/50 text-xs uppercase tracking-wide">Rückgabe</p>
              <p className="font-semibold text-yellow-900">{reservation?.end_date}</p>
            </div>
          </div>
        </div>

        {/* ── PDF Viewer ── */}
        <div className="border-2 rounded-lg bg-yellow-400/5 border-yellow-900/5 p-5 flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-yellow-900">
            📄 Ihr Mietvertrag
          </h2>
          <iframe
            src={pdfUrl}
            className="w-full h-[500px] rounded-lg border-2 border-yellow-900/10"
            title="Mietvertrag"
          />
          <div className="bg-amber-900/10 p-3 rounded-lg text-yellow-900 text-sm font-semibold">
            ⚠️ Bitte scrollen Sie durch den gesamten Vertrag bevor Sie unterschreiben.
          </div>
        </div>

        {/* ── Signature or Success ── */}
        {!signed ? (
          <div className="border-2 rounded-lg bg-yellow-400/5 border-yellow-900/5 p-5 flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-yellow-900">
              ✍️ Ihre Unterschrift
            </h2>

            {/* Canvas */}
            <div>
              <label className="text-xl font-semibold text-yellow-900 block mb-2">
                Hier unterschreiben
              </label>
              <div className="border-2 border-dashed border-yellow-900/20 rounded-lg bg-white p-1">
                <canvas
                  ref={canvasRef}
                  className="block w-full h-32 rounded-lg cursor-crosshair touch-none"
                  style={{ background: "white" }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>
              <p className="text-yellow-900/50 text-xs text-center mt-1">
                Mit Maus, Stift oder Finger unterschreiben
              </p>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-yellow-900 flex-shrink-0"
              />
              <span className="text-yellow-900 text-sm font-semibold">
                Ich bestätige, dass ich den Vertrag gelesen und verstanden habe
                und stimme allen Bedingungen zu.
              </span>
            </label>

            {error && <p className="text-red-600 text-sm">⚠️ {error}</p>}

            {/* Buttons */}
            <div className="flex gap-3 justify-end flex-wrap">
              <button
                onClick={clearCanvas}
                className="px-5 py-2.5 rounded-lg border-2 border-yellow-900/20 text-yellow-900 font-semibold text-sm hover:bg-yellow-900/5 transition"
              >
                🗑 Löschen
              </button>
              <button
                onClick={handleSign}
                disabled={signing || !hasDrawn || !agreed}
                className={`px-7 py-2.5 rounded-lg font-bold text-sm text-white transition
                  ${hasDrawn && agreed
                    ? "bg-yellow-900 hover:bg-yellow-800 cursor-pointer"
                    : "bg-yellow-900/30 cursor-not-allowed"
                  }`}
              >
                {signing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Wird gespeichert...
                  </span>
                ) : (
                  "Vertrag unterzeichnen →"
                )}
              </button>
            </div>
          </div>

        ) : (

          /* ── Success + Download + WhatsApp ── */
          <div className="border-2 rounded-lg bg-yellow-400/5 border-yellow-900/5 p-8 flex flex-col items-center text-center gap-4">

            <div className="w-20 h-20 rounded-full bg-yellow-900 flex items-center justify-center text-white text-4xl">
              ✓
            </div>

            <h2 className="text-2xl font-bold text-yellow-900">
              Vertrag unterzeichnet!
            </h2>

            <p className="text-yellow-900/70 text-sm leading-relaxed max-w-sm">
              Ihr unterzeichneter Vertrag wurde sicher gespeichert.
              Laden Sie ihn herunter und senden Sie dann eine WhatsApp-Nachricht
              an Amaros zur Bestätigung Ihrer Buchung.
            </p>

            <div className="bg-amber-900/10 p-4 rounded-lg w-full text-left text-sm text-yellow-900">
              <p className="font-bold mb-1">Was passiert als nächstes?</p>
              <ol className="list-decimal list-inside space-y-1 font-semibold text-yellow-900/80">
                <li>Laden Sie Ihren unterschriebenen Vertrag herunter</li>
                <li>Klicken Sie auf den WhatsApp-Button</li>
                <li>Senden Sie die vorbereitete Nachricht ab</li>
                <li>Amaros bestätigt Ihre Buchung per WhatsApp</li>
              </ol>
            </div>

            {/* ✅ Download button */}
            {signedUrl && (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border-2 border-yellow-900 text-yellow-900 font-bold text-sm rounded-lg py-3 px-8 hover:bg-yellow-900/5 transition"
              >
                📥 Unterschriebenen Vertrag herunterladen
              </a>
            )}

            {/* ✅ WhatsApp button */}
            <button
              onClick={openWhatsApp}
              className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#20b858] text-white font-bold text-base rounded-lg py-4 px-8 transition cursor-pointer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Jetzt auf WhatsApp senden
            </button>

            <p className="text-xs text-yellow-900/40">
              Nach dem Senden wartet Amaros Ihre Buchung zu bestätigen.
            </p>

          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}