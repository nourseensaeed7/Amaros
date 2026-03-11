import React from 'react';
import Nav from "../components/Nav.jsx";
import Vans from "../components/Vans.jsx";
import Footer from "../components/Footer.jsx";
import PageLoader from "../components/PageLoader";
const AllVans =()=>{
    return(
        <PageLoader>
        <section >
            <Nav/>
            <div className="my-20">
            <Vans />
            </div>
            <Footer/>
        </section>
        </PageLoader>
    )
}
export default AllVans;