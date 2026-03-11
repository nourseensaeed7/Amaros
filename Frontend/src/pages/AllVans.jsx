import React from 'react';
import Nav from "../components/Nav.jsx";
import Vans from "../components/Vans.jsx";
import Footer from "../components/Footer.jsx";

const AllVans =()=>{
    return(
        <section >
            <Nav/>
            <div className="my-20">
            <Vans />
            </div>
            <Footer/>
        </section>
    )
}
export default AllVans;