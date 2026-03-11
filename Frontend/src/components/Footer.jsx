import React from "react";
import { MdMailOutline } from "react-icons/md";
import { FiPhoneCall } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { FaFacebookSquare } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-amber-950/10">
      <div className="flex flex-col p-5 gap-4 md:flex-row pt-10 justify-around text-amber-950">
        <div className="max-w-70">
          <div className="m-1">
            <div>
              <h3 className="text-xl font-black">Abholungsort </h3>
              <p className="m-1 font-medium">
                Direkt am Banhof Niederhasli Mandachstrasse 50, 8155 Niederhasli
              </p>
            </div>
            <h2 className="text-xl py-2 font-black">Büro Adresse</h2>
            <div>
              <h3 className="text-lg font-bold">Amaros Inh. Soliman</h3>
              <p className="m-1 font-medium">Alte poststresse 3 </p>
              <p className="m-1 font-medium">8172 Niederglatt</p>
            </div>
          </div>
        </div>
        <div className="w-70">
          <h2 className="text-xl font-black">Kontakt</h2>
          <div className="m-1 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-lg">
              <FiPhoneCall />
              <a>+41 78 471 16 72</a>
            </div>
            <div className="flex items-center gap-2 text-lg">
              <MdMailOutline className="text-xl" />
              <a href="mailto:Amaros@bluewin.ch">Amaros@bluewin.ch</a>{" "}
            </div>
            <div className="flex items-center gap-3  text-3xl">
              <div>
                <a href="https://wa.me/message/WP5JU4QYGPTYB1" target="blank"><FaWhatsapp /></a>
              </div>
              <div>
                <a href="https://www.instagram.com/amaros_transport_zh?igsh=MWFidDlpMnN4Z216cw%3D%3D&utm_source=qr" target="blank"><FaInstagram /></a>
              </div>
              <div>
                <a href="https://www.facebook.com/share/1B2ZrCie4T/?mibextid=wwXIfr" target="blank"><FaFacebookSquare /></a>
              </div>
            </div>
          </div>
        </div>
          <div className="">
            <h2 className="text-xl font-black">Rechtliches</h2>

          </div>
      </div>
      <div className="flex flex-col justify-center items-center">
      <img src={logo} alt="logo" className="w-25" />
      <p className="text-center p-4">© 2026 Amaros. All rights reserved</p>
      </div>
    </footer>
  );
};
export default Footer;
