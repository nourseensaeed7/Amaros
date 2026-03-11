import React from "react";
import Nav from "../components/Nav.jsx";
import Header from "../components/Header.jsx";
import Vans from "../components/Vans.jsx";
import RentalProcess from "../components/RentalProcess.jsx"
import Footer from "../components/Footer.jsx";
import PageLoader from "../components/PageLoader";
const Home = () => {
  return (
    <PageLoader>
    <section>
      <Nav />
      <Header />
      <Vans />
      <RentalProcess/>
      <Footer/>
    </section>
    </PageLoader>
  );
};
export default Home;
