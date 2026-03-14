import React from 'react';
import Nav from "../components/Nav";
import Footer from '../components/Footer';
const About=()=>{
    return(
        <section>
            <Nav/>
            <div className="my-20 text-amber-950 px-5 md:px-15">
                <h1 className='text-3xl md:text-3xl font-medium my-2  text-center bg-gradient-to-r from-yellow-700/90  to-yellow-600/80 text-transparent bg-clip-text'>Über uns</h1>
                <h2 className='text-sm font-bold md:text-base lg:text-lg text-center'>Willkommen bei Amaros</h2>
                <div className='indent  font-medium text-lg flex flex-col gap-4 py-5'>
                <p>Wir stehen für zuverlässige Dienstleistungen, einfache Abläufe und einen kundenorientierten Service. Unser Ziel ist es, unseren Kunden praktische und unkomplizierte Lösungen anzubieten – schnell, flexibel und transparent.</p>
                <p>Als inhabergeführtes Unternehmen legen wir grossen Wert auf persönliche Betreuung und direkten Kontakt. Wir glauben daran, dass guter Service mit Vertrauen, Ehrlichkeit und klarer Kommunikation beginnt.</p>
                <p>Unsere Angebote richten sich sowohl an Privatpersonen als auch an Unternehmen, die eine einfache und zuverlässige Lösung suchen. Dabei achten wir besonders auf faire Preise, eine unkomplizierte Abwicklung und eine hohe Servicequalität.</p>
                <p>Die Zufriedenheit unserer Kunden steht für uns an erster Stelle. Deshalb arbeiten wir kontinuierlich daran, unsere Dienstleistungen zu verbessern und unser Angebot weiterzuentwickeln.</p>
                <p>Amaros steht für Verlässlichkeit, Qualität und einen Service, auf den du dich verlassen kannst.</p>
                </div>
            </div>
            <Footer/>
        </section>
    )
};
export default About;