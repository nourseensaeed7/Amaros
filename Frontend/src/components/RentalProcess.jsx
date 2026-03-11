import React from "react";
import AllVans from "../assets/allVans.jpeg";
import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const RentalProcess = () => {
      const navigate=useNavigate();
  
  return (
    <section className="relative w-full">

      {/* Background Image */}
      <img
        src={AllVans}
        alt="Van"
        className="w-full h-[60vh] sm:h-[70vh] lg:h-[85vh] object-cover"
      />

      {/* White Smoke Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/70 to-white/90"></div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-10 lg:px-20">

        <h2 className="
          text-3xl sm:text-4xl md:text-5xl lg:text-5xl
          font-bold
          mb-4
          bg-gradient-to-r from-yellow-700 to-yellow-600
          text-transparent bg-clip-text
        ">
          Beginne deine Reise mit Vertrauen
        </h2>

        <h3 className="
          text-base sm:text-lg md:text-xl
          font-medium
          max-w-2xl
          mb-3
        ">
          Entdecke unseren nahtlosen und vollständig digitalen Mietprozess.
        </h3>

        <p className="
          text-sm sm:text-base md:text-lg
          font-semibold
          max-w-3xl
          mb-6
        ">
          Von der Buchung bis zur Schlüsselübergabe ist jeder Schritt auf
          Einfachheit, Sicherheit und höchsten Komfort ausgelegt.
        </p>

        <button
          className="
            flex items-center gap-2
            text-black font-bold
            bg-gradient-to-br from-yellow-700 via-amber-100 to-yellow-600
            px-6 py-3
            rounded-lg
            transition-all duration-500 ease-in-out
            hover:scale-105
            cursor-pointer
            hover:from-yellow-600 hover:to-yellow-500
            
          "
          onClick={()=>navigate('/Rental-Instructions')}
        >
          Zum Mietprozess
          <FaArrowRight />
        </button>

      </div>
    </section>
  );
};

export default RentalProcess;