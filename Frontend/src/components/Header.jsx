import { useEffect, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FaUserClock } from "react-icons/fa6";
import header from "../assets/header.jpeg";
import { FcSurvey } from "react-icons/fc";
import { FcOk } from "react-icons/fc";

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
        className="min-w-1/2
        p-5 lg:pl-15 
        flex flex-col
        justify-center
        gap-4
        z-10
      "
      >
        <h2 className="text-xl  sm:text-xl md:text-lg lg:text-2xl tracking-wide">
          <Typewriter text="Brauchst du einen Lieferwagen?" />
        </h2>
        <h1
          className="
        text-5xl  md:text-[40px] lg:text-[55px]
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

        <ul className=" max-w-xl p-3">
          {/* item */}
          <li className="space-y-1">
            <div className="flex items-center gap-1 text-yellow-700 font-semibold">
              <FaUserClock className="text-xl md:text-xl ml-1" />
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
            <div className="flex items-center gap-1 text-yellow-700 font-semibold">
              <FcOk  className="text-xl md:text-xl" />
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
            <div className="flex items-start md:items-center  gap-1 text-yellow-700 font-semibold">
              <FcSurvey  className="text-3xl md:text-2xl " />
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
            <div className="flex items-center gap-1 text-yellow-700 font-semibold">
              <FaMapMarkerAlt className="text-xl md:text-xl text-red-600 " />
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
         bg-[linear-gradient(to_right,#f5f5f5_0%,transparent_40%),linear-gradient(to_top,#f5f5f5_5%,transparent_40%),linear-gradient(to_left,#f5f5f5_0%,transparent_30%)]"
        ></div>
      </div>
    </header>
  );
};

export default Header;
