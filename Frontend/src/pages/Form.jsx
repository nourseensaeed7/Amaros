import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { IoImageOutline } from "react-icons/io5";
import { LuCalendarDays } from "react-icons/lu";
import { supabase } from "../supabaseClient";
import { useVehicles } from "../hooks/useVehicles.js";
import Nav from "../components/Nav";
import Footer from "../components/Footer.jsx";
import PageLoader from "../components/PageLoader";
// ─── Country List (Wohnsitzland only) ─────────────────────────────────────────

// ─── Toast Notifications ──────────────────────────────────────────────────────
// A lightweight, themed replacement for the browser's native alert() popup.
// Stacks in the top-right corner, auto-dismisses after a few seconds, and can
// be dismissed early by clicking it.
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[90vw] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`cursor-pointer rounded-lg shadow-lg px-4 py-3 text-sm font-semibold text-white animate-[fadeIn_0.2s_ease-out] ${
            t.type === "success" ? "bg-green-700" : "bg-red-700"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

const EUROPE_COUNTRIES = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina",
  "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy",
  "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta",
  "Moldova", "Monaco", "Montenegro", "Netherlands", "North Macedonia", "Norway",
  "Poland", "Portugal", "Romania", "Russia", "San Marino", "Serbia", "Slovakia",
  "Slovenia", "Spain", "Sweden", "Switzerland", "Turkey", "Ukraine",
  "United Kingdom", "Vatican City",
];

// ─── Flatpickr calendar visual fixes ─────────────────────────────────────────
// - Hides the previous/next month "padding" days so only the days that
//   actually belong to the displayed month are shown (avoids them being
//   mistaken for disabled/past days).
// - Gives disabled (past) days a clearly muted look, and makes sure normal
//   selectable days (including all of next month, once you navigate there)
//   stay fully visible/dark.
// - Restyles the default black focus ring on the date input to match the
//   site's yellow-900 theme.
// - IMPORTANT: force-styles `.flatpickr-input` itself (background, border,
//   padding, placeholder color) with !important. This is the fix for the
//   mobile bug from the screenshot — flatpickr adds the `flatpickr-input`
//   class to your real <input>, so whatever theme .css you import
//   (material_blue, light, dark, whichever you switch to later) can end up
//   overriding your Tailwind classes and swallowing the placeholder/border.
//   These rules win regardless of theme, so that can't happen again.
// - Also defines the `fadeIn` keyframe used by the toast animation, so it
//   works even if tailwind.config.js doesn't have it registered.
function FlatpickrStyleFixes() {
  return (
    <style>{`
      @keyframes fadeIn {
        0%   { opacity: 0; transform: translateY(-4px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      .flatpickr-input {
        background: #fff !important;
        border: 2px solid rgba(120, 53, 15, 0.1) !important;
        border-radius: 0.5rem !important;
        padding: 0.5rem 2.75rem 0.5rem 0.5rem !important;
        color: #1c1917 !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
        display: block !important;
      }
      .flatpickr-input::placeholder {
        color: rgba(120, 53, 15, 0.4) !important;
        opacity: 1 !important;
      }
      .flatpickr-input:focus,
      .flatpickr-input:focus-visible {
        outline: none !important;
        box-shadow: 0 0 0 2px rgba(120, 53, 15, 0.3) !important;
        border-color: #78350f !important;
      }

      .flatpickr-day.prevMonthDay,
      .flatpickr-day.nextMonthDay {
        visibility: hidden;
        pointer-events: none;
      }
      .flatpickr-day {
        color: #1c1917;
      }
      .flatpickr-day.flatpickr-disabled,
      .flatpickr-day.flatpickr-disabled:hover {
        color: #d4d4d4 !important;
        cursor: not-allowed;
      }
      .flatpickr-day.today {
        border-color: #78350f;
      }
      .flatpickr-day.selected,
      .flatpickr-day.selected:hover {
        background: #78350f;
        border-color: #78350f;
      }
    `}</style>
  );
}

function CountryDropdown({
  value,
  onChange,
  countries = EUROPE_COUNTRIES,
  placeholder = "Land auswählen",
  searchPlaceholder = "Suchen...",
  noResultsText = "Keine Ergebnisse",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const filtered = countries.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (country) => {
    onChange(country); // passes string directly, not an event
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        className="flex items-center justify-between border-2 p-2 bg-white border-yellow-900/5 rounded-lg cursor-pointer"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <span className={value ? "text-black" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <span
          className={`text-yellow-900 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-yellow-900/10 rounded-lg shadow-lg overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-yellow-900/10 bg-yellow-50/50">
            <span className="text-yellow-900/40 text-sm">🔍</span>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent outline-none text-sm text-yellow-900 placeholder-yellow-900/40 focus:ring-0"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-yellow-900/30 text-xs hover:text-yellow-900/60"
              >
                ✕
              </button>
            )}
          </div>

          {/* List */}
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400">{noResultsText}</li>
            )}
            {filtered.map((country) => (
              <li
                key={country}
                onClick={() => handleSelect(country)}
                className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-yellow-50 transition-colors ${
                  value === country
                    ? "font-semibold text-yellow-900 bg-yellow-50/70"
                    : "text-gray-700"
                }`}
              >
                {country}
                {value === country && (
                  <span className="text-yellow-800 text-xs">✓</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── File Upload Field (attachment-card style) ───────────────────────────────
// Mirrors the "Attachments" pattern from the reference design: an "+ Add File"
// dashed dropzone-style trigger, and once a file is chosen, a card with a file
// icon, name, size, and a red "✕" to remove — same yellow-900 theme as the
// rest of the form.
//
// NOTE: this field intentionally does NOT rely on the native HTML5 "required"
// attribute. The underlying <input type="file"> is visually hidden
// (display:none), and browsers cannot show their native validation prompt on
// a hidden element — that can silently block form submission with no visible
// error at all. Presence is instead enforced explicitly in handleSubmit,
// where a clear German toast tells the user exactly what's missing.
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes}b`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}kb`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
}

function FileUploadField({ label, file, onChange, accept = "image/*" }) {
  const inputRef = useRef(null);

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xl font-semibold text-yellow-900">{label}</label>

      {file ? (
        <div className="flex items-center justify-between gap-2 border-2 border-yellow-900/5 bg-white rounded-lg p-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 flex items-center justify-center w-9 h-9 rounded-md bg-yellow-900/10 text-yellow-900 text-lg">
              <IoImageOutline />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-yellow-950 truncate">{file.name}</p>
              <p className="text-xs text-yellow-900/50">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label={`${label} entfernen`}
            className="shrink-0 ml-2 text-red-500 hover:text-red-700 font-semibold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      ) : (
        <label className="box-border flex w-full items-center justify-center gap-2 border-2 border-dashed border-yellow-900/20 rounded-lg p-2.5 text-sm text-yellow-900/60 cursor-pointer hover:border-yellow-900/40 hover:bg-yellow-50/50 transition-colors">
          <span className="text-base leading-none">+</span> Add File
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onChange(e.target.files[0] || null)}
          />
        </label>
      )}
    </div>
  );
}

// ─── Date Field (Start / Finish box style) ───────────────────────────────────
// Mirrors the reference design's "Start" / "Finish" boxes: a small uppercase
// label, the date value, and a calendar icon on the right — same white box /
// yellow-900 border theme, still backed by Flatpickr for the actual picking.
// `min-w-0` on the wrapper + `box-border` on the input stop the field from
// ever overflowing its grid column on narrow/mobile screens.
function DateField({ label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xl text-yellow-900 font-semibold">{label}</label>
      <div className="relative min-w-0">
        <Flatpickr
          value={value}
          onChange={onChange}
          options={{ ...options, placeholder }}
          placeholder={placeholder}
          className="box-border w-full p-2 pr-11 bg-white border-2 border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md bg-yellow-900/10 text-yellow-900 text-sm">
          <LuCalendarDays />
        </span>
      </div>
    </div>
  );
}

const Form = () => {
  const { id } = useParams();
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles();
  const vehicle = vehicles.find((v) => v.id === Number(id));

  const kmPrice = 0.6;
  const hourPrice = 20.0;
  const reductionPrice = 12.0;
  const volkasko = 15.0;
  const navigate=useNavigate();

  // ── Form state ──
  const [customerType, setCustomerType] = useState("private");
  const [firmaName, setFirmaName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [strasse, setStrasse] = useState("");
  const [zip, setZip] = useState("");
  const [residentCountry, setResidentCountry] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [birthError, setBirthError] = useState("");
  const [mobile,setMobile]=useState("")
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseFrontFile, setLicenseFrontFile] = useState(null);
  const [licenseBackFile, setLicenseBackFile] = useState(null);
  const [IDFrontFile, setIDFrontFile] = useState(null);
  const [IDBackFile, setIDBackFile] = useState(null);
  const [reservedDates, setReservedDates] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [redu, setRedu] = useState(false);
  const [insuRedu, setInsuRedu] = useState(false);
  const [km, setKm] = useState(0);
  const [hour, setHour] = useState(0);
  const [kmActive, setkmActive] = useState(false);
  const [hourActive, setHourActive] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState("");
  const [terms, setTerms] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };
  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const totalKmPrice = km * kmPrice;
  const totalHoursPrice = hourPrice * hour;
  const extraTotal =
    (redu ? reductionPrice : 0) +
    (kmActive ? totalKmPrice : 0) +
    (hourActive ? totalHoursPrice : 0) +
    (insuRedu ? volkasko : 0);
  const total = Number(extraTotal + totalPrice);

  // ── Scroll lock when modal is open ──
  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
  }, [showModal]);

  // ── Terms modal handlers ──
  const handleCheckboxClick = (e) => {
    if (!terms) {
      e.preventDefault();
      setShowModal(true);
    } else {
      setTerms(false);
    }
  };
  const acceptTerms = () => {
    setTerms(true);
    setShowModal(false);
  };

  // ── Price calculation ──
  const calculatePrice = (start, end) => {
    if (!start || !end || !vehicle) { setTotalPrice(0); return; }
    const diffDays =
      Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    setTotalPrice(diffDays * vehicle.price);
  };

  // ── Load reserved dates ──
  const loadReservedDates = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("start_date, end_date")
      .eq("car_id", Number(id));
    if (error) return console.error(error);
    if (data)
      setReservedDates(data.map((item) => ({ from: item.start_date, to: item.end_date })));
  };

  useEffect(() => { if (id) loadReservedDates(); }, [id]);

  // ── Age validation ──
  const isAgeValid = () => {
    if (!birthdate) return false;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 25;
  };

  const handleBirthdateChange = (dateStr) => {
    setBirthdate(dateStr);
    if (!dateStr) { setBirthError(""); return; }
    const today = new Date();
    const birth = new Date(dateStr);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    setBirthError(age < 25 ? "Der Fahrer muss mindestens 25 Jahre alt sein." : "");
  };

  // ── File upload ──
  // NOTE: the "files" bucket is private, so we no longer call getPublicUrl().
  // We store the object path and generate short-lived signed URLs server-side
  // whenever the document actually needs to be viewed.
  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const filePath = `${folder}/${folder}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("files").upload(filePath, file);
    if (error) { console.error(error); return null; }
    return filePath;
  };

// ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!isAgeValid())
      return showToast("Der Fahrer muss mindestens 25 Jahre alt sein.");
    if (!startDate || !endDate)
      return showToast("Bitte wählen Sie Start- und Rückgabedatum.");
    if (!licenseFrontFile)
      return showToast("Bitte laden Sie die Vorderseite Ihres Führerscheins hoch.");
    if (!licenseBackFile)
      return showToast("Bitte laden Sie die Rückseite Ihres Führerscheins hoch.");
    if (!IDFrontFile)
      return showToast("Bitte laden Sie die Vorderseite Ihres Ausweises hoch.");
    if (!IDBackFile)
      return showToast("Bitte laden Sie die Rückseite Ihres Ausweises hoch.");
    if (!firstName || !lastName || !email || !mobile || !residentCountry || !terms)
      return showToast("Bitte füllen Sie alle Pflichtfelder aus und akzeptieren Sie die AGB.");
    if (kmActive && km <= 0)
      return showToast("Bitte geben Sie die Anzahl der zusätzlichen Kilometer an.");
    if (hourActive && hour <= 0)
      return showToast("Bitte geben Sie die Anzahl der zusätzlichen Stunden an.");

    // Upload files
    const licenseFrontPath = await uploadFile(licenseFrontFile, "license_front");
    const licenseBackPath  = await uploadFile(licenseBackFile, "license_back");
    const idFrontPath      = await uploadFile(IDFrontFile, "id_front");
    const idBackPath       = await uploadFile(IDBackFile, "id_back");
    if (!licenseFrontPath || !licenseBackPath || !idFrontPath || !idBackPath)
      return showToast("Fehler beim Hochladen der Dateien.");

    try {
      // ── Create customer + reservation ────────────────────────────────────
      // Runs server-side via the create-reservation edge function (service
      // role key), since anon has no SELECT access on these tables and a
      // direct .insert().select() from the browser can't read the row back.
      const { data: createData, error: createError } = await supabase.functions.invoke(
        "create-reservation",
        {
          body: {
            customer: {
              customer_type:      customerType,
              firma_name:         customerType === "firma" ? firmaName : null,
              first_name:         firstName,
              last_name:          lastName,
              email:              email,
              mobile:             mobile,
              birthdate:          birthdate,
              license_no:         licenseNo,
              license_front_path: licenseFrontPath,
              license_back_path:  licenseBackPath,
              id_front_path:      idFrontPath,
              id_back_path:       idBackPath,
              address:            strasse,
              zip:                zip,
              resident_country:   residentCountry,
            },
            reservation: {
              car_id:                Number(id),
              reservation_date:      startDate,
              start_date:            startDate,
              end_date:              endDate,
              haftpflicht_reduktion: redu,
              vollkasko_reduktion:   insuRedu,
              extra_km:              kmActive ? km : 0,
              extra_km_price:        kmActive ? totalKmPrice : 0,
              extra_hours:           hourActive ? hour : 0,
              extra_hours_price:     hourActive ? totalHoursPrice : 0,
              extra_total:           extraTotal,
              total_price:           total,
              km_active:             kmActive,
              hour_active:           hourActive,
              contract_status:       "pending",
              contract_path:         null,
              signed_contract_path:  null,
              signed_at:             null,
            },
          },
        }
      );

      if (createError || createData?.error) {
        throw new Error(createData?.error || "Fehler beim Speichern der Reservierung.");
      }

      const newReservationId = createData.reservationId;

      showToast("Reservierung erfolgreich gespeichert!", "success");

      // ── Reset form ───────────────────────────────────────────────────────
      setCustomerType("private");
      setFirmaName("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setBirthdate("");
      setLicenseNo("");
      setLicenseFrontFile(null);
      setLicenseBackFile(null);
      setIDFrontFile(null);
      setIDBackFile(null);
      setStrasse("");
      setZip("");
      setMobile("");
      setResidentCountry("");
      setStartDate(null);
      setEndDate(null);
      setRedu(false);
      setInsuRedu(false);
      setKm(0);
      setHour(0);
      setkmActive(false);
      setHourActive(false);
      setTerms(false);
      setTotalPrice(0);
      loadReservedDates();

      // ── Navigate to signing page ─────────────────────────────────────────
      // Pass the new reservation ID so SignContract can load the correct PDF.
      // Delayed slightly so the success toast above actually has time to be
      // seen before the route change unmounts this page (immediate navigate
      // was unmounting the toast before the user could read it).
      setTimeout(() => {
        navigate(`/Van-Form/${id}/sign-contract`, {
          state: { reservationId: newReservationId },
        });
      }, 800);

    } catch (err) {
      console.error(err);
      showToast("Fehler beim Speichern der Reservierung: " + err.message);
    }
  };

  // Vehicle data hasn't arrived from Supabase yet
  if (vehiclesLoading) {
    return (
      <PageLoader>
        <section>
          <Nav />
        </section>
      </PageLoader>
    );
  }

  // Fetch failed, or no vehicle matches this id
  if (vehiclesError || !vehicle) {
    return (
      <PageLoader>
        <section>
          <Nav />
          <p className="text-center my-20">Fahrzeug nicht gefunden.</p>
        </section>
      </PageLoader>
    );
  }

  return (
    <PageLoader>
    <section>
      <FlatpickrStyleFixes />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Nav />
      <div className="flex flex-col-reverse pt-15 m-5 md:m-10 gap-5 justify-center md:flex-row">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 border-2 rounded-lg bg-yellow-400/5 border-yellow-900/5 w-full lg:w-[60%] p-5 md:p-10"
        >
          {/* ── Customer Type ── */}
          <div className="text-xl font-semibold text-yellow-900 flex justify-evenly">
            <label>
              <input
                type="radio"
                name="customerType"
                value="private"
                checked={customerType === "private"}
                onChange={() => setCustomerType("private")}
              />
              {" "}Private
            </label>
            <label>
              <input
                type="radio"
                value="firma"
                checked={customerType === "firma"}
                onChange={() => setCustomerType("firma")}
              />
              {" "}Firma
            </label>
          </div>

          {/* ── Firma ── */}
          {customerType === "firma" && (
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Firma</label>
              <input
                type="text"
                placeholder="Firma"
                value={firmaName}
                onChange={(e) => setFirmaName(e.target.value)}
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
              />
            </div>
          )}

          {/* ── Name ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Vorname*</label>
              <input
                type="text"
                placeholder="Vorname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Nachname*</label>
              <input
                type="text"
                placeholder="Nachname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
              />
            </div>
          </div>

          {/* ── Address ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Strasse*</label>
              <input
                type="text"
                placeholder="Strasse"
                value={strasse}
                onChange={(e) => setStrasse(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">PLZ/Ort*</label>
              <input
                type="text"
                placeholder="PLZ/Ort"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
              />
            </div>
          </div>

          {/* ── Wohnsitzland + Geburtsdatum ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Wohnsitzland*</label>
              <CountryDropdown
                value={residentCountry}
                onChange={setResidentCountry}
                countries={EUROPE_COUNTRIES}
                placeholder="Wohnsitzland"
                noResultsText="Kein europäisches Land gefunden"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Geburtsdatum*</label>
              <Flatpickr
                value={birthdate}
                onChange={(d, s) => handleBirthdateChange(s)}
                options={{ dateFormat: "Y-m-d", maxDate: "today" }}
                className="box-border w-full p-2 bg-white border-2 border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
                placeholder="Geburtsdatum auswählen"
              />
              {birthError && (
                <span className="text-red-600 text-sm mt-1">{birthError}</span>
              )}
            </div>
          </div>

          {/* ──Email + Mobile ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">E-Mail Adresse*</label>
              <input
                type="email"
                placeholder="E-Mail Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Mobile*</label>
              <input
                type="tel"
                placeholder="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
                required
              />
            </div>
          </div>

          {/* ── Reservation Dates (Start / Finish box style) ── */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DateField
                label="Reservierungsdatum"
                value={startDate}
                onChange={(d, s) => {
                  setStartDate(s);
                  setEndDate(null);
                  calculatePrice(s, null);
                }}
                options={{ dateFormat: "Y-m-d", minDate: "today", disable: reservedDates }}
                placeholder="Startdatum auswählen"
              />
              <DateField
                label="Rückgabedatum"
                value={endDate}
                onChange={(d, s) => {
                  setEndDate(s);
                  calculatePrice(startDate, s);
                }}
                options={{
                  dateFormat: "Y-m-d",
                  minDate: startDate || "today",
                  disable: reservedDates,
                }}
                placeholder="Rückgabedatum auswählen"
              />
            </div>

            {startDate && endDate && (
              <div className="bg-amber-900/20 p-3 rounded-lg">
                <p>
                  Mietdauer:{" "}
                  <strong>
                    {Math.ceil(
                      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
                    ) + 1}{" "}
                    Tage
                  </strong>
                </p>
                <p>Preis pro Tag: <strong>{vehicle.price} CHF</strong></p>
                <p className="text-lg font-bold">Gesamtpreis: {totalPrice} CHF</p>
              </div>
            )}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>

          {/* ── Führerausweis ── */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Führerausweis*</label>
              <input
                type="text"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="Führerausweis"
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg outline-none focus:border-yellow-700 focus:ring-2 focus:ring-yellow-700/30"
              />
            </div>
          </div>

          {/* ── File Uploads: ID Vorder-/Rückseite (attachment-card style) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FileUploadField
              label="ID Vorderseite*"
              file={IDFrontFile}
              onChange={setIDFrontFile}
            />
            <FileUploadField
              label="ID Rückseite*"
              file={IDBackFile}
              onChange={setIDBackFile}
            />
          </div>

          {/* ── File Uploads: Führerschein Vorder-/Rückseite (attachment-card style) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FileUploadField
              label="Führerschein Vorderseite*"
              file={licenseFrontFile}
              onChange={setLicenseFrontFile}
            />
            <FileUploadField
              label="Führerschein Rückseite*"
              file={licenseBackFile}
              onChange={setLicenseBackFile}
            />
          </div>

          {/* ── Zusatzleistungen ── */}
          <div className="mx-1 flex flex-col gap-2">
            <h3 className="text-xl py-1 font-semibold text-yellow-900">Zusatzleistungen</h3>
            <div className="flex items-center gap-12 text-yellow-900 text-sm font-semibold">
              <label>
                <input
                  type="checkbox"
                  name="haftpflicht"
                  className="mx-1"
                  checked={redu}
                  onChange={(e) => setRedu(e.target.checked)}
                />
                Selbstbehaltreduktion Haftpflicht auf CHF 500.00 – CHF 12.00 / Tag
              </label>
            </div>
            <div className="flex items-center gap-12 text-yellow-900 text-sm font-semibold">
              <label>
                <input
                  type="checkbox"
                  name="vollkasko_reduktion"
                  className="mx-1"
                  checked={insuRedu}
                  onChange={(e) => setInsuRedu(e.target.checked)}
                />
                Selbstbehaltreduktion Vollkasko auf CHF 500.00 – CHF 15.00 / Tag
              </label>
            </div>
            <div className="flex items-center gap-12 text-yellow-900 text-sm font-semibold">
              <label>
                <input
                  type="checkbox"
                  checked={kmActive}
                  onChange={(e) => setkmActive(e.target.checked)}
                  className="mx-1"
                />
                Zusätzliche Kilometer (CHF 0.60 / km)
              </label>
              {kmActive && (
                <div className="flex items-center gap-2">
                  <label>Anzahl Kilometer:</label>
                  <input
                    type="number"
                    value={km === 0 ? "" : km}
                    min={1}
                    placeholder="0"
                    className="bg-white rounded-lg w-10 text-center"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setKm(val === "" ? 0 : Number(val));
                    }}
                  />
                  <span>+ CHF {totalKmPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-5 text-yellow-900 text-sm font-semibold">
              <label>
                <input
                  type="checkbox"
                  checked={hourActive}
                  onChange={(e) => setHourActive(e.target.checked)}
                  className="mx-1"
                />
                Zusätzliche Stunden (CHF 20.00 / Stunde)
              </label>
              {hourActive && (
                <div className="flex items-center gap-1">
                  <label>Anzahl Stunden:</label>
                  <input
                    type="number"
                    value={hour === 0 ? "" : hour}
                    min={1}
                    placeholder="0"
                    className="bg-white rounded-lg w-10 text-center"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHour(val === "" ? 0 : Number(val));
                    }}
                  />
                  <span>+ CHF {totalHoursPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-yellow-950 font-bold text-2xl">
            Total Zusatzleistungen:{" "}
            <span className="block lg:inline">CHF {total.toFixed(2)}</span>
          </p>

          <label>
            <input
              type="checkbox"
              checked={terms}
              onChange={() => {}}
              onClick={handleCheckboxClick}
            />
            {" "}Agree on terms and conditions
          </label>

          {/* ── Terms Modal ── */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
              <div className="bg-white w-11/12 md:w-3/4 lg:w-1/2 h-4/5 md:h-3/4 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-xl font-bold p-4 border-b">Terms and Conditions</h2>
                <div className="flex-1 overflow-auto p-4">
                <embed src="terms.pdf" type="application/pdf" width="100%" height="100%" />                </div>
                <div className="p-4 flex justify-end space-x-2 border-t">
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded-md"
                    onClick={acceptTerms}
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded-md"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Submit Button ── */}
          <button
            type="submit"
            className="bg-yellow-900 text-white p-3 rounded-lg mt-3 cursor-pointer disabled:cursor-auto disabled:opacity-50"
          >
            Jetzt Reservieren
          </button>
        </form>

        {/* ── Vehicle Info Card ── */}
        <div className="text-yellow-900 border-2 p-2 bg-yellow-400/5 border-yellow-900/5 rounded-lg h-fit w-fit md:w-120 lg:w-90">
          <img src={vehicle.image[0]} className="mb-3" />
          <h2 className="text-xl font-semibold">{vehicle.name}</h2>
          <p>Preis: {vehicle.price}.-CHF/Tag</p>
          <p>Nutzlast: {vehicle.payload}</p>
          <p>Kraftstoff: {vehicle.fuel}</p>
        </div>
      </div>
      <Footer />
    </section>
    </PageLoader>
  );
};

export default Form;