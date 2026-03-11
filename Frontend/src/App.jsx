import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
//   Navigate,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Details from "./pages/Details.jsx";
import Form from "./pages/Form.jsx";
import Vans from "./pages/AllVans.jsx"
import Rental from "./pages/rentInst.jsx"
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Vehicle-Details/:id" element={<Details/>}/>
        <Route path="/Van-Form/:id"element={<Form />}/>
        <Route path="/vans" element={<Vans />} />
        <Route path="/Rental-Instructions" element={<Rental />} />

      </Routes>
    </BrowserRouter>
  );
};
export default App;
