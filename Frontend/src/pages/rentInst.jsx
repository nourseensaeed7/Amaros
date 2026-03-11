import React from "react";
import Nav from "../components/Nav.jsx";
import Keybox from "../assets/KeyBoxOpen.jpeg";
import Footer from "../components/Footer.jsx";

const rentInst = () => {
  const rentalSteps = [
    {
      title: "Buchungsformular ausfüllen",
      description:
        "Fülle das Mietformular mit deinen persönlichen Daten, dem gewünschten Mietzeitraum und deinem bevorzugten Van aus.",
    },
    {
      title: "Vertrag per WhatsApp erhalten",
      description:
        "Nach dem Absenden des Formulars erhältst du deinen Mietvertrag direkt per WhatsApp.",
    },
    {
      title: "Vertrag unterschreiben & zurücksenden",
      description:
        "Bitte prüfe den Vertrag sorgfältig, unterschreibe ihn und sende ihn per WhatsApp an uns zurück.",
    },
    {
      title: "Buchungsbestätigung",
      description:
        "Sobald wir den unterschriebenen Vertrag erhalten haben, bestätigen wir deine Buchung ebenfalls per WhatsApp.",
    },
    {
      title: "Zugangscode am Miettag erhalten",
      description:
        "Am Tag deiner Anmietung erhältst du einen persönlichen Zugangscode.Mit diesem Code kannst du die Sicherheitsbox öffnen, die sich hinter der Fahrertür befindet. In der Box findest du den Schlüssel für deinen Van.",
    },
  ];
  return (
    <section>
      <Nav />
      <div className="mt-20 ">
        <div className="flex flex-col justify-center items-center">
          <h1 className="text-4xl font-medium my-2 text-center bg-gradient-to-r from-yellow-700/90  to-yellow-600/80 text-transparent bg-clip-text">
            So mietest du einen Van bei Amaros
          </h1>
          <p className="text-lg text-center">
            Die Anmietung bei Amaros ist einfach, sicher und komplett digital.
          </p>
        </div>
        <div className="flex m-5 lg:m-10 justify-center gap-4 items-center flex-col-reverse lg:flex-row">
          <ol className="px-10 min-w-[70%] space-y-5">
            {rentalSteps.map((step, index) => (
              <li key={index}>
                <h2 className="text-2xl font-semibold text-yellow-800">
                  {index + 1}.{step.title}
                </h2>
                <p className="indent text-xl">{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="bg-gradient-to-r from-yellow-700/90 to-yellow-600/80 p-[3px] rounded-2xl h-fit w-fit inline-block">
            <img src={Keybox} alt="Keybox" className="rounded-2xl block max-h-150 lg:w-200 " />
          </div>
        </div>
      </div>
      <Footer/>
    </section>
  );
};
export default rentInst;
