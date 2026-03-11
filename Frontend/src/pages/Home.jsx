import React from "react";
import Nav from "../components/Nav.jsx";
import Header from "../components/Header.jsx";
import Vans from "../components/Vans.jsx";
import RentalProcess from "../components/RentalProcess.jsx"
import Footer from "../components/Footer.jsx";
const Home = () => {
  return (
    <section>
      <Nav />
      <Header />
      <Vans />
      <RentalProcess/>
      <Footer/>
    </section>
  );
};
export default Home;
