import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "../assets/logo.png";
import { FaWhatsapp } from "react-icons/fa";
import { FaFacebookSquare } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav
        className="
          fixed top-0 left-0 w-full z-50
          bg-gradient-to-b
          from-white
          via-white/90
          to-white/5
        "
      >
        <div className="max-w-7xl mx-10 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center gap-2">
              <img src={logo} alt="logo" className="h-12 w-auto" />
              <h1 className=" bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 text-transparent bg-clip-text tracking-widest cinzel text-3xl">
                Amaros
              </h1>
            </div>
          </Link>
          {/* Desktop Menu */}
          <ul className="hidden items-center text-lg md:flex gap-8 font-medium">
            <li className="cursor-pointer transition-all duration-400 ease-in-out hover:bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 hover:text-transparent bg-clip-text">
              <Link to="/">Home</Link>
            </li>
            <li className="cursor-pointer transition-all duration-400 ease-in-out hover:bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 hover:text-transparent bg-clip-text">
              <a href="">Über uns</a>
            </li>
            <li className="cursor-pointer transition-all duration-400 ease-in-out hover:bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 hover:text-transparent bg-clip-text">
              <a onClick={() => navigate("/vans")}>Alle Lieferwagen</a>
            </li>
            <li className="cursor-pointer transition-all duration-400 ease-in-out hover:bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 hover:text-transparent bg-clip-text">
              <a onClick={() => navigate("/Rental-Instructions")}>Mietprozess</a>
            </li>
            <li className="flex items-center gap-4  text-3xl">
              <div>
                <a href="https://wa.me/message/WP5JU4QYGPTYB1"  target="blank"><FaWhatsapp /></a>
              </div>
              <div>
                <a href="https://www.instagram.com/amaros_transport_zh?igsh=MWFidDlpMnN4Z216cw%3D%3D&utm_source=qr" target="blank"><FaInstagram /></a>
              </div>
              <div>
                <a href="https://www.facebook.com/share/1B2ZrCie4T/?mibextid=wwXIfr" target="blank"><FaFacebookSquare /></a>
              </div>

            </li>
          </ul>

          {/* Mobile Icon */}
          <button className="md:hidden text-2xl" onClick={() => setOpen(true)}>
            <FaBars />
          </button>
        </div>
      </nav>

      {/* ================= SIDE NAV ================= */}
      <div
        className={`
          fixed top-0 right-0 h-full w-64
          bg-white shadow-xl
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
          z-50
        `}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <button onClick={() => setOpen(false)} className="text-xl">
            <FaTimes />
          </button>
        </div>

        <ul className="flex flex-col gap-6 p-6 font-medium">
            <li className="cursor-pointer transition-all duration-400 ease-in-out hover:bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 hover:text-transparent bg-clip-text">
            <Link to="/">Home</Link>
          </li>
            <li className="cursor-pointer transition-all duration-400 ease-in-out hover:bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 hover:text-transparent bg-clip-text">
            <a href="">Über uns</a>
          </li>
            <li className="cursor-pointer transition-all duration-400 ease-in-out hover:bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 hover:text-transparent bg-clip-text">
            <a onClick={() => navigate("/vans")}>Alle Lieferwagen</a>
          </li>
            <li className="cursor-pointer transition-all duration-400 ease-in-out hover:bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-800 hover:text-transparent bg-clip-text">
              <a onClick={() => navigate("/Rental-Instructions")}>Mietprozess</a>
          </li>
        </ul>
      </div>

      {/* ================= OVERLAY ================= */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
