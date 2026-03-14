import { React, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Vehicles } from "../data/Vehicles.js";
import { BsFuelPumpDiesel } from "react-icons/bs";
import { TbManualGearbox } from "react-icons/tb";
import { MdAirlineSeatReclineNormal } from "react-icons/md";
import { GrCapacity } from "react-icons/gr";
import { IoPin } from "react-icons/io5";
import Nav from "../components/Nav";
import { IoMdArrowDropright } from "react-icons/io";
import { IoMdArrowDropleft } from "react-icons/io";
import Footer from "../components/Footer.jsx";
import PageLoader from "../components/PageLoader";
const Details = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const vehicle = Vehicles.find((v) => v.id === Number(id));
  // Carousel state
  const [currentImage, setCurrentImage] = useState(0);

  // Handle next image
  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % vehicle.image.length);
  };
  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + vehicle.image.length) % vehicle.image.length);
  };

  // Auto-slide every 2 seconds
  useEffect(() => {
    const interval = setInterval(nextImage, 10000);
    return () => clearInterval(interval);
  }, []);
  return (
    <PageLoader>
    <section>
      <Nav />
      <div className="flex flex-col-reverse justify-self-center justify-center bg-yellow-600/5 border-10 border-yellow-900/5 shadow-2xl rounded-2xl text-amber-950   mx-5 my-20 md:flex-col-reverse lg:m-25 lg:flex-row  ">
        <div className="text-lg  flex flex-col self-center justify-center m-7 md:m-10 ">
          <h1 className="text-[1.8rem] font-extrabold">{vehicle.name}</h1>
          <hr className=" mt-5"></hr>
        <div className="flex items-center justify-around font-medium my-3 text-base ">
          <div className="flex items-center justify-center gap-1">
            <BsFuelPumpDiesel className="text-sm" />
            <span className="block" >{vehicle.fuel}</span>
          </div>
          <div className="flex items-center justify-center ">
            <TbManualGearbox className="" />
            <span className="block" > {vehicle.transmission}</span>
          </div>
          <div className="flex items-center justify-center ">
            <MdAirlineSeatReclineNormal className=" " />
            <span className="block" > {vehicle.seats}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <GrCapacity className="" />
            <span className="block text-sm md:text-base" > {vehicle.payload}</span>
          </div>
        </div>
          <hr className=""></hr>
          <div className="grid grid-cols-3 my-3 font-medium text-base ">
          <div className="text-center">
            <span>L:{vehicle.length}</span>
          </div>
          <div className="text-center">
            <span>B:{vehicle.width}</span>
          </div>
          <div className="text-center">
            <span>H:{vehicle.height}</span>
          </div>
          </div>
          <hr className=""></hr>
          <div>
            <h2 className="text-2xl mb-2 mt-4 font-semibold indent">
              Zusätzliches Zubehör
            </h2>
            <ul className=" font-medium px-9 text-base list-disc">
              <li>Spanngurte: 8 Stück</li>
              <li>Plattformwagen: 1 Stück</li>
              <li>Transportroller: 2 Stück</li>
              <li>Sackkarre: 1 Stück </li>
              <li>Umzugsdecken: 5 Stück</li>
            </ul>
          </div>
          <hr className=" mt-5"></hr>
          <div>
            <h2 className="text-2xl  mt-4 font-semibold indent">
              Preis:<span className="block md:inline lg:inline"> CHF {vehicle.price}.- Tag</span>
              <span className="text-sm md:indent ">(07:00-19:00)</span>
            </h2>
            <p className="indent text-sm ">Zusätzliche Stünde à CHF 20.-</p>
            <p className="indent text-sm ">
              Inklusive 250 km, danach CHF 0.60 pro km
            </p>
          </div>
          <hr className="mt-5"></hr>
          <div>
            <h2 className="text-2xl  mt-4 font-semibold indent">Abholort</h2>
            <div className="flex indent">
              <IoPin className="text-3xl text-red-600 " />
              <p>
                Mandachstrasse 50, 8155 Niederhasli Direkt am Bahnhof
                Niederhasli.
              </p>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Mandachstrasse+50,+8155+Niederhasli,+Switzerland"
              target="_blank"
              className="underline indent text-base font-mono hover:text-blue-700"
            >
              Google Maps Route öffnen
            </a>
          </div>

          <button
            className="bg-yellow-900/90 mt-7  font-medium p-2 rounded-lg shadow-2xl hover:bg-yellow-900 cursor-pointer text-amber-50"
            onClick={() => navigate(`/Van-Form/${vehicle.id}`)}
          >
            Jetzt Ihren Transporter buchen
          </button>
        </div>

        <div className="
        md:w-dvh
        relative
        self-center
        "> 
           <img
            src={vehicle.image[currentImage]}
            alt={`${vehicle.name} ${currentImage + 1}`}
            className=" p-6 rounded-4xl"
          />
          <button
            onClick={nextImage}
            className="absolute  lg:right-14 bottom-8  right-10 cursor-pointer bg-yellow-900/80 text-amber-50 p-2 rounded-lg hover:bg-yellow-900"
          >
            <IoMdArrowDropright className="text-3xl" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-10 bottom-8 cursor-pointer bg-yellow-900/80 text-amber-50 p-2 rounded-lg hover:bg-yellow-900"
          >
            <IoMdArrowDropleft className="text-3xl" />
          </button>
        </div>
      </div>
      <Footer/>
    </section>
    </PageLoader>
  );
};
export default Details;
