import React from 'react'
import Nav from "../components/Nav";
import Footer from '../components/Footer';
const Policy=()=>{
    return(
        <section>
            <Nav/>
            <div className="my-20 text-amber-950 px-5 md:px-15">
                <h1 className="text-2xl md:text-3xl py-4 font-black">Datenschutzerklärung</h1>
                <p className='indent'>Der Schutz deiner persönlichen Daten ist uns wichtig. In dieser Datenschutzerklärung informieren wir darüber, welche Daten wir auf unserer Website erfassen und wie wir sie verwenden.</p>
                <ol className='list-decimal indent  font-semibold'>
                    <li className='m-2'>
                        <h2 className="text-xl">Erhebung und Verarbeitung von Daten</h2>
                        <p className='font-medium'>Beim Besuch unserer Website können automatisch Informationen erfasst werden, wie z.B.:</p>
                        <ul className='list-disc indent p-2 font-normal'>
                            <li>IP-Adresse</li>
                            <li>Datum und Uhrzeit des Zugriffs</li>
                            <li>verwendeter Browser</li>
                            <li>Betriebssystem</li>
                        </ul>
                        <p className='font-medium'>Diese Daten dienen ausschliesslich der technischen Bereitstellung und Verbesserung der Website.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Kontaktaufnahme</h2>
                        <p className='font-medium'>Wenn du uns über ein Formular, WhatsApp oder E-Mail kontaktierst, werden deine Angaben zur Bearbeitung der Anfrage und für mögliche Anschlussfragen gespeichert.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Verwendung der Daten</h2>
                        <p className='font-medium'>Die erhobenen Daten werden ausschliesslich verwendet für:</p>
                        <ul className='list-disc indent p-2 font-normal'>
                            <li>Kommunikation mit Kunden</li>
                            <li>Bearbeitung von Anfragen</li>
                            <li>Verbesserung unserer Dienstleistungen</li>
                        </ul>
                        <p className='font-medium'>Wir geben deine Daten nicht ohne deine Zustimmung an Dritte weiter, ausser wenn dies gesetzlich erforderlich ist.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Cookies</h2>
                        <p className='font-medium'>Unsere Website kann Cookies verwenden, um die Nutzung der Website zu erleichtern und bestimmte Funktionen bereitzustellen.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Rechte der Nutzer</h2>
                        <p className='font-medium'>Du hast jederzeit das Recht auf Auskunft über die gespeicherten personenbezogenen Daten sowie das Recht auf Berichtigung oder Löschung.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Kontakt</h2>
                        <p className='font-medium '>Bei Fragen zum Datenschutz kannst du uns jederzeit kontaktieren:</p>
                        <span className='font-medium'>E-Mail: amaros@bluewin.ch</span>
                    </li>
                </ol>
            </div>
            <Footer/>
        </section>
    )
};
export default Policy;
