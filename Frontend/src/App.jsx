import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import CookieConsent from "react-cookie-consent";
import { useTracking } from "./hooks/useTracking";
import Home from "./pages/Home.jsx";
import Details from "./pages/Details.jsx";
import Form from "./pages/Form.jsx";
import Vans from "./pages/AllVans.jsx";
import Rental from "./pages/rentInst.jsx";
import ScrollToTop from "./ScrollToTop";
import Imprint from "./pages/Imprint.jsx";
import Policy from "./pages/Policy.jsx";
import Terms from "./pages/Terms.jsx";
import About from "./pages/About.jsx";
import RequireBooking from "./components/RequireBooking";
import SignContract from "./pages/SignContract";

function TrackingWrapper() {
  useTracking();
  return null; // renders nothing
}
const App = () => {
  return (
    <HashRouter>
      <TrackingWrapper />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Vehicle-Details/:id" element={<Details />} />
        <Route path="/Van-Form/:id" element={<Form />} />
        <Route path="/vans" element={<Vans />} />
        <Route path="/Rental-Instructions" element={<Rental />} />
        <Route path="/Imprint" element={<Imprint />} />
        <Route path="/Policy" element={<Policy />} />
        <Route path="/Terms" element={<Terms />} />
        <Route path="/about-us" element={<About />} />
          <Route path="/Van-Form/:id/sign-contract" element={
            <RequireBooking>
              <SignContract />
            </RequireBooking>
          } />
      </Routes>
      <CookieConsent
        location="bottom"
        buttonText="Ich akzeptiere"
        declineButtonText="Ablehnen"
        enableDeclineButton
        style={{ background: "#1a1a1e" }}
        buttonStyle={{
          background: "#e94560",
          color: "white",
          borderRadius: "6px",
          fontWeight: "bold",
        }}
        declineButtonStyle={{
          background: "transparent",
          border: "1px solid white",
          color: "white",
          borderRadius: "6px",
        }}
        expires={365}
      >
        Diese Website verwendet Cookies, um die Nutzererfahrung zu verbessern.
        Weitere Informationen finden Sie in unserer{" "}
        <a href="/Amaros/terms.pdf" style={{ color: "#e94560" }}>
          Datenschutzerklärung
        </a>
        .
      </CookieConsent>
    </HashRouter>
  );
};

export default App;
