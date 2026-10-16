import React from 'react'
import Nav from "../components/Nav";
import Footer from '../components/Footer';

// Content follows nDSG Art. 19 (controller, purposes, recipients, foreign
// transfers, retention, rights). Keep it in sync with the providers the code
// actually uses — and have it reviewed by a Swiss lawyer.
const Policy=()=>{
    return(
        <section>
            <Nav/>
            <div className="my-20 text-amber-950 px-5 md:px-15">
                <h1 className="text-2xl md:text-3xl py-4 font-black">Datenschutzerklärung</h1>
                <p className='indent'>Mit dieser Datenschutzerklärung informieren wir Sie, welche Personendaten wir beim Besuch unserer Website und bei der Buchung eines Fahrzeugs bearbeiten, wozu, an wen wir sie weitergeben und welche Rechte Sie haben. Massgebend ist das Schweizer Datenschutzgesetz (DSG).</p>
                <ol className='list-decimal indent  font-semibold'>
                    <li className='m-2'>
                        <h2 className="text-xl">Verantwortliche Stelle</h2>
                        <p className='font-medium'>Amaros Inh. Soliman, Alte Poststrasse 3, 8172 Niederglatt, Schweiz<br/>E-Mail: amaros@bluewin.ch · Telefon: +41 78 471 16 72</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Besuch der Website</h2>
                        <p className='font-medium'>Beim Aufruf der Website verarbeitet unser Hosting-Anbieter technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browser und Betriebssystem), um die Seite auszuliefern und vor Missbrauch zu schützen.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Cookies und Besucherstatistik</h2>
                        <p className='font-medium'>Wir speichern ein Cookie „CookieConsent“, das Ihre Auswahl im Cookie-Hinweis für 365 Tage festhält. Nur wenn Sie zustimmen, erfassen wir eine Besucherstatistik: aufgerufene Seite, Gerätetyp (Mobil/Desktop), verweisende Seite sowie Land und Stadt. Für Land und Stadt wird Ihre IP-Adresse an den Dienst ipapi.co (Kloudend Inc., USA) übermittelt; die IP-Adresse selbst speichern wir nicht. Sie können die Einwilligung jederzeit widerrufen, indem Sie die Cookies Ihres Browsers für diese Website löschen.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Buchung und Mietvertrag</h2>
                        <p className='font-medium'>Für eine Buchung bearbeiten wir:</p>
                        <ul className='list-disc indent p-2 font-normal'>
                            <li>Name, gegebenenfalls Firma, Adresse, Wohnsitzland, E-Mail, Mobilnummer und Geburtsdatum</li>
                            <li>Führerscheinnummer sowie Fotos von Vorder- und Rückseite Ihres Führerscheins und Ihres Ausweises</li>
                            <li>Buchungsdaten (Fahrzeug, Zeitraum, Zusatzleistungen, Preis), den Mietvertrag und Ihre elektronische Unterschrift</li>
                        </ul>
                        <p className='font-medium'>Zweck: Abschluss und Abwicklung des Mietvertrags, Prüfung von Identität, Mindestalter (25 Jahre) und Fahrberechtigung, Bearbeitung von Schäden, Bussen und Ansprüchen sowie die Erfüllung gesetzlicher Aufbewahrungspflichten. Ohne diese Angaben können wir kein Fahrzeug vermieten.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Kontakt</h2>
                        <p className='font-medium'>Wenn Sie uns per E-Mail, Telefon oder WhatsApp kontaktieren, bearbeiten wir Ihre Angaben zur Beantwortung Ihrer Anfrage. Bei WhatsApp gelten zusätzlich die Datenschutzbestimmungen von WhatsApp (Meta).</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Empfänger und Auftragsbearbeiter</h2>
                        <p className='font-medium'>Wir geben Personendaten nur weiter, soweit es für die genannten Zwecke nötig ist:</p>
                        <ul className='list-disc indent p-2 font-normal'>
                            <li>GitHub Inc., USA – Hosting der Website</li>
                            <li>Supabase Inc., USA – Datenbank, Dateispeicher und Server-Funktionen für Buchungen und Verträge</li>
                            <li>Sendinblue SAS (Brevo), Frankreich – Versand von Buchungs- und Vertrags-E-Mails</li>
                            <li>Kloudend Inc. (ipapi.co), USA – Standortermittlung für die Statistik, nur mit Ihrer Einwilligung</li>
                            <li>Behörden und Versicherungen, soweit wir gesetzlich dazu verpflichtet sind oder es zur Abwicklung von Schäden und Bussen erforderlich ist</li>
                        </ul>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Bekanntgabe ins Ausland</h2>
                        <p className='font-medium'>Frankreich verfügt über einen angemessenen Datenschutz. Für die USA stützen wir uns auf die Zertifizierung des Empfängers unter dem Swiss-U.S. Data Privacy Framework oder auf die vom EDÖB anerkannten Standardvertragsklauseln. Die Übermittlung an ipapi.co erfolgt gestützt auf Ihre Einwilligung.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Aufbewahrung</h2>
                        <p className='font-medium'>Mietverträge und buchungsrelevante Unterlagen bewahren wir 10 Jahre auf (Art. 958f OR). Fotos von Ausweis und Führerschein löschen wir spätestens 90 Tage nach Rückgabe des Fahrzeugs, ausser sie werden für einen offenen Schaden- oder Bussenfall benötigt. Statistikdaten enthalten keine direkt identifizierenden Angaben.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Datensicherheit</h2>
                        <p className='font-medium'>Daten werden verschlüsselt übertragen (HTTPS). Ausweise und Verträge liegen in nicht öffentlichen Speicherbereichen, auf die nur wir zugreifen können.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Ihre Rechte</h2>
                        <p className='font-medium'>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Herausgabe Ihrer Daten sowie Widerspruch gegen die Bearbeitung, soweit keine gesetzlichen Pflichten entgegenstehen. Schreiben Sie dazu an amaros@bluewin.ch; wir können einen Identitätsnachweis verlangen. Sie können sich zudem beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB, www.edoeb.admin.ch) beschweren. Sofern für Sie die DSGVO gilt, stehen Ihnen die entsprechenden Rechte und ein Beschwerderecht bei Ihrer Aufsichtsbehörde zu.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Änderungen</h2>
                        <p className='font-medium '>Wir können diese Datenschutzerklärung anpassen. Es gilt die auf dieser Seite veröffentlichte Fassung. Stand: Oktober 2026.</p>
                    </li>
                </ol>
            </div>
            <Footer/>
        </section>
    )
};
export default Policy;
