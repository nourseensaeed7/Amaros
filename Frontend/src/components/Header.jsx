import { useEffect, useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import { FaHandshake } from "react-icons/fa";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FaClock } from "react-icons/fa";
import header from "../assets/header.jpeg";

function Typewriter({ text, speed = 100 }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index === text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayedText}</>;
}

const Header = () => {
  return (
    <header className="flex flex-col-reverse justify-center  md:flex-row w-full  ">
      <div
        className="
        w-full lg:w-1/2
        px-4 sm:px-6 lg:px-12
        py-8 lg:py-0
        flex flex-col
        justify-center
        gap-4
        z-10
      "
      >
        <h2 className="text-xl  sm:text-2xl md:text-xl lg:text-2xl tracking-wide">
          <Typewriter text="Brauchst du einen Lieferwagen?" />
        </h2>

        <h1
          className="
        text-4xl sm:text-5xl md:text-5xl lg:text-[3rem]
        cinzel
        bg-gradient-to-r
        from-yellow-700
        to-yellow-600/80
        text-transparent
        bg-clip-text
      "
        >
          Amaros hat dich abgedeckt.
        </h1>

        {/* FEATURES */}

        <ul className=" max-w-xl ">
          {/* item */}
          <li className="space-y-1">
            <div className="flex items-start gap-3 text-yellow-700 font-semibold">
              <FaClock className="text-base sm:text-lg text-white drop-shadow shrink-0 mt-1" />

              <h3 className="text-xl md:text-base lg:text-xl ">
                Unkompliziert & flexibel
              </h3>
            </div>

            <p className="text-base md:text-sm lg:text-base text-gray-700 pl-7">
              Selbstabholung und Rückgabe – genau dann, wenn es für dich passt.
            </p>
          </li>

          {/* item */}
          <li className="space-y-1">
            <div className="flex items-start gap-3 text-yellow-700 font-semibold">
              <FaHandshake className="text-base sm:text-lg shrink-0 mt-1" />

              <h3 className="text-xl md:text-base lg:text-xl ">
                Transporthilfe inklusive
              </h3>
            </div>

            <p className="text-base md:text-sm lg:text-base text-gray-700 pl-7">
              Auf Wunsch bekommst du die Unterstützung, die du brauchst.
            </p>
          </li>

          {/* item */}
          <li className="space-y-1">
            <div className="flex items-start gap-3 text-yellow-700 font-semibold">
              <FaFileAlt className="text-base sm:text-lg text-white drop-shadow shrink-0 mt-1" />

              <h3 className="text-xl md:text-base lg:text-xl ">
                Kein Papierkram. Keine versteckten Gebühren.
              </h3>
            </div>

            <p className="text-base md:text-sm lg:text-base text-gray-700 pl-7">
              Nur dein Lieferwagen — sofort verfügbar.
            </p>
          </li>

          {/* item */}
          <li className="space-y-1">
            <div className="flex items-start gap-3 text-yellow-700 font-semibold">
              <FaMapMarkerAlt className="text-base sm:text-lg text-red-600 shrink-0 mt-1" />

              <h3 className="text-xl md:text-base lg:text-xl ">
                Top-Lage in Niederhasli
              </h3>
            </div>

            <p className="text-base md:text-sm lg:text-base text-gray-700 pl-7">
              Mandachstrasse 50, 8155 Niederhasli
            </p>
          </li>
        </ul>
      </div>
      <div
        className="relative w-full h-100 min-w-[50%] lg:w-1/2 lg:h-170 md:h-135  
            bg-right
            bg-no-repeat
            bg-[length:100%]
            "
        style={{
          backgroundImage: `url(${header})`,
        }}
      >
        <div
          className="absolute inset-0
         bg-[linear-gradient(to_right,#f5f5f5_0%,transparent_60%),linear-gradient(to_top,#f5f5f5_5%,transparent_60%),linear-gradient(to_left,#f5f5f5_0%,transparent_60%)]"
        ></div>
      </div>
    </header>
  );
};

export default Header;
