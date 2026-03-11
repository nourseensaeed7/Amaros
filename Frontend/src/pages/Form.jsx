import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { supabase } from "../supabaseClient";
import { Vehicles } from "../data/Vehicles";
import Nav from "../components/Nav";
import Footer from "../components/Footer.jsx";
import PageLoader from "../components/PageLoader";
// ─── Country Lists ────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany",
  "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru",
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal",
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

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

function CountryDropdown({
  value,
  onChange,
  countries = COUNTRIES,
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
              className="flex-1 bg-transparent outline-none text-sm text-yellow-900 placeholder-yellow-900/40"
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

const Form = () => {
  const { id } = useParams();
  const vehicle = Vehicles.find((v) => v.id === Number(id));

  const kmPrice = 0.6;
  const hourPrice = 20.0;
  const reductionPrice = 12.0;
  const volkasko = 15.0;

  // ── Form state ──
  const [customerType, setCustomerType] = useState("private");
  const [firmaName, setFirmaName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [strasse, setStrasse] = useState("");
  const [zip, setZip] = useState("");
  const [ID, setID] = useState("");
  const [nationallity, setNationallity] = useState("");   
  const [residentCountry, setResidentCountry] = useState("");
  const [email, setEmail] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [birthError, setBirthError] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile,setMobile]=useState("")
  const [city, setCity]=useState("")
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseIssuedate, setLicenseIssuedate] = useState("");
  const [licenseCategory, setLicenseCategory] = useState("");
  const [passportFile, setPassportFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
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
    if (!start || !end) { setTotalPrice(0); return; }
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
  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const filePath = `${folder}/${folder}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("files").upload(filePath, file);
    if (error) { console.error(error); return null; }
    const { data } = supabase.storage.from("files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!isAgeValid())
      return alert("Der Fahrer muss mindestens 25 Jahre alt sein.");
    if (!startDate || !endDate)
      return alert("Bitte wählen Sie Start- und Rückgabedatum.");
    if (!passportFile)
      return alert("Bitte laden Sie einen gültigen Pass oder Ausweis hoch.");
    if (!licenseFile)
      return alert("Bitte laden Sie einen Führerschein hoch.");
    if (!firstName || !lastName || !email || !phone || !nationallity || !residentCountry || !terms)
      return alert("Bitte füllen Sie alle Pflichtfelder aus und akzeptieren Sie die AGB.");

    // Upload files
    const passportUrl = await uploadFile(passportFile, "passport");
    const licenseUrl = await uploadFile(licenseFile, "license");
    if (!passportUrl || !licenseUrl)
      return alert("Fehler beim Hochladen der Dateien.");

    try {
      // Insert customer
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert([
          {
            customer_type: customerType,
            firma_name: customerType === "firma" ? firmaName : null,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            mobile: mobile,
            birthdate: birthdate,
            license_no: licenseNo,
            license_issue_date: licenseIssuedate,
            license_category: licenseCategory,
            passport_url: passportUrl,
            license_url: licenseUrl,
            address: strasse,
            zip: zip,
            nationality: nationallity,
            resident_country: residentCountry, 
            id_passport: ID,
          },
        ])
        .select()
        .single();

      if (customerError) throw new Error(customerError.message);

      // Insert reservation
      const { error: reservationError } = await supabase
        .from("reservations")
        .insert([
          {
            customer_id: customer.id,
            car_id: Number(id),
            reservation_date: startDate,
            start_date: startDate,
            end_date: endDate,
            haftpflicht_reduktion: redu,
            vollkasko_reduktion: insuRedu,
            extra_km: kmActive ? km : 0,
            extra_km_price: kmActive ? totalKmPrice : 0,
            extra_hours: hourActive ? hour : 0,
            extra_hours_price: hourActive ? totalHoursPrice : 0,
            extra_total: extraTotal,
            total_price: total,
            km_active: kmActive,
            hour_active: hourActive,
          },
        ]);

      if (reservationError) throw new Error(reservationError.message);

      alert("Reservierung erfolgreich!");

      // Reset form — FIX: added setResidentCountry("")
      setCustomerType("private");
      setFirmaName("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setBirthdate("");
      setLicenseNo("");
      setLicenseIssuedate("");
      setLicenseCategory("");
      setPassportFile(null);
      setLicenseFile(null);
      setStrasse("");
      setZip("");
      setID("");
      setNationallity("");
      setMobile("")
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
    } catch (err) {
      console.error(err);
      alert("Fehler beim Speichern der Reservierung: " + err.message);
    }
  };

  return (
    <PageLoader>
    <section>
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
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
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
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
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
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
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
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">PLZ/Ort*</label>
              <input
                type="number"
                placeholder="PLZ/Ort"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
              />
            </div>
          </div>
          {/* ── Wohnsitzland (Europe) + E-Mail ── NEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Stadt*</label>
              <input
                value={city}
                onChange={(e)=>setCity(e.target.value)}
                placeholder="Stadt"
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"

              />
            </div>
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Geburtsdatum*</label>
              <Flatpickr
                value={birthdate}
                onChange={(d, s) => handleBirthdateChange(s)}
                options={{ dateFormat: "Y-m-d", maxDate: "today" }}
                className="p-2 bg-white rounded-lg"
                placeholder="Geburtsdatum auswählen"
              />
              {birthError && (
                <span className="text-red-600 text-sm mt-1">{birthError}</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Mobile</label>
              <input
                type="tel"
                placeholder="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
              />
            </div>
          </div>

          {/* ── ID + Nationality ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">ID/Pass Nr.*</label>
              <input
                type="text"
                placeholder="ID/Pass Nr."
                value={ID}
                onChange={(e) => setID(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Nationalität*</label>
              {/* FIX: onChange={setNationallity} — CountryDropdown passes string, not event */}
              <CountryDropdown
                value={nationallity}
                onChange={setNationallity}
                placeholder="Nationalität"
              />
            </div>
          </div>

          {/* ── Birthdate + Phone ── CHANGED: Phone moved here from standalone row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">E-Mail Adresse*</label>
              <input
                type="email"
                placeholder="E-Mail Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Telefonnummer*</label>
              <input
                type="tel"
                placeholder="Telefonnummer"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
              />
            </div>
          </div>

          {/* ── Reservation Dates ── */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xl text-yellow-900 font-semibold">Reservierungsdatum</label>
                <Flatpickr
                  value={startDate}
                  onChange={(d, s) => {
                    setStartDate(s);
                    setEndDate(null);
                    calculatePrice(s, null);
                  }}
                  options={{ dateFormat: "Y-m-d", minDate: "today", disable: reservedDates }}
                  className="p-2 bg-white rounded-lg"
                  placeholder="Startdatum auswählen"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xl text-yellow-900 font-semibold">Rückgabedatum</label>
                <Flatpickr
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
                  className="p-2 bg-white rounded-lg"
                  placeholder="Rückgabedatum auswählen"
                />
              </div>
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

          {/* ── License ── CHANGED: Führerausweis paired with Ausstellungsort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Führerausweis*</label>
              <input
                type="text"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="Führerausweis"
                className="border-2 p-2 bg-white border-yellow-900/5 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">Ausstellungsort*</label>
              <Flatpickr
                value={licenseIssuedate}
                onChange={(d, s) => setLicenseIssuedate(s)}
                options={{ dateFormat: "Y-m-d", maxDate: "today" }}
                className="p-2 bg-white rounded-lg"
                placeholder="Ausstellungsort"
              />
            </div>
          </div>

          {/* ── License Category ── */}
          <div className="grid grid-cols-1  gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="category" className="text-xl font-semibold text-yellow-900">
                Kategorie*
              </label>
              <select
                id="category"
                value={licenseCategory}
                onChange={(e) => setLicenseCategory(e.target.value)}
                className="p-2 bg-white text-gray-500 cursor-pointer rounded-lg"
              >
                <option value="" disabled>Kategorie auswählen</option>
                <option value="B">B</option>
                <option value="BE">BE</option>
                <option value="C">C</option>
                <option value="C1">C1</option>
                <option value="CE">CE</option>
                <option value="C1E">C1E</option>
                <option value="D1">D1</option>
                <option value="D1E">D1E</option>
              </select>
            </div>
          </div>

          {/* ── File Uploads ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">
                Gültiger Pass / ID hochladen*
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPassportFile(e.target.files[0])}
                required
                className="border cursor-pointer p-2 rounded-lg bg-yellow-900/90 text-white hover:bg-yellow-900"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xl font-semibold text-yellow-900">
                Führerschein hochladen*
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLicenseFile(e.target.files[0])}
                required
                className="border cursor-pointer p-2 rounded-lg bg-yellow-900/90 text-white hover:bg-yellow-900"
              />
            </div>
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
                    value={km}
                    min={1}
                    className="bg-white rounded-lg w-10 text-center"
                    onChange={(e) => setKm(Number(e.target.value || 0))}
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
                    value={hour}
                    min={1}
                    className="bg-white rounded-lg w-10 text-center"
                    onChange={(e) => setHour(Number(e.target.value || 0))}
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
                  <embed src="/terms.pdf" type="application/pdf" width="100%" height="100%" />
                </div>
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
            disabled={
              !isAgeValid() ||
              !startDate ||
              !endDate ||
              !passportFile ||
              !licenseFile ||
              !firstName ||
              !lastName ||
              !email ||
              !phone ||
              !nationallity ||
              !residentCountry ||
              !terms
            }
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