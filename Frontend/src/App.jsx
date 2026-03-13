import React from "react";
import {
  HashRouter,
  Routes,
  Route,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Details from "./pages/Details.jsx";
import Form from "./pages/Form.jsx";
import Vans from "./pages/AllVans.jsx"
import Rental from "./pages/rentInst.jsx"
import ScrollToTop from "./ScrollToTop";
import Imprint from "./pages/Imprint.jsx";
import Policy from "./pages/Policy.jsx";
import Terms from "./pages/Terms.jsx";
const App = () => {
  return (
    <HashRouter>
      <ScrollToTop/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Vehicle-Details/:id" element={<Details/>}/>
        <Route path="/Van-Form/:id" element={<Form />}/>
        <Route path="/vans" element={<Vans />} />
        <Route path="/Rental-Instructions" element={<Rental />} />
        <Route path="/Imprint"element={<Imprint/>}/>
        <Route path="/Policy"element={<Policy/>}/>
        <Route path="/Terms"element={<Terms/>}/>
      </Routes>
    </HashRouter>
  );
};

export default App;