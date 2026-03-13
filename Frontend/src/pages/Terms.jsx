import React from 'react';
import Nav from "../components/Nav";
import Footer from '../components/Footer';
const Terms=()=>{
    return(
        <section>
            <Nav/>
            <div className="my-20 text-amber-950 px-5 md:px-15">
                <h1 className="text-2xl md:text-3xl py-4 font-black">Allgemeine Geschäftsbedingungen (AGB)</h1>
                <ol className='list-decimal  indent font-semibold'>
                    <li className='m-2'>
                        <h2 className="text-xl">Geltungsbereich</h2>
                        <p className='font-medium'>Diese Allgemeinen Geschäftsbedingungen gelten für alle Dienstleistungen und Angebote von Amaros – Inhaber Solomon.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Vertragsabschluss</h2>
                        <p className='font-medium'>Ein Vertrag kommt zustande, sobald ein Kunde eine Dienstleistung oder ein Produkt über unsere Website, telefonisch oder schriftlich bestellt und wir diese Bestellung bestätigen.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Preise</h2>
                        <p className='font-medium'>Alle Preise verstehen sich in Schweizer Franken (CHF), sofern nicht anders angegeben.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Zahlung</h2>
                        <p className='font-medium'>Die Zahlung erfolgt gemäss den vereinbarten Zahlungsbedingungen.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Haftung</h2>
                        <p className='font-medium'>Wir haften nur für Schäden, die durch vorsätzliches oder grob fahrlässiges Verhalten verursacht wurden, soweit gesetzlich zulässig.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Änderungen</h2>
                        <p className='font-medium '>Wir behalten uns vor, diese AGB jederzeit anzupassen.</p>
                    </li>
                    <li className='m-2'>
                        <h2 className="text-xl">Anwendbares Recht</h2>
                        <p className='font-medium '>Es gilt ausschliesslich schweizerisches Recht. Gerichtsstand ist der Sitz des Unternehmens.</p>
                    </li>
                </ol>
            </div>
            <Footer/>
        </section>
    )
};
export default Terms;