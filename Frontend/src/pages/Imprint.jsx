import React from 'react'
import Nav from "../components/Nav";
import Footer from '../components/Footer';

const Imprint=()=>{
    return(
        <section>
            <Nav/>
            <div className="my-20 text-amber-950 px-5 md:px-15">
                <h1 className="text-2xl md:text-3xl py-4 font-black">Impressum</h1>
                <h2 className="text-xl font-bold indent">Angaben gemäss Art. 3 Abs. 1 lit. s UWG (Schweiz)</h2>
                <p className='indent'>Amaros Inh. Soliman</p>
                <div className='px-5 md:px-10'>
                <div>
                    <h3 className="text-lg font-semibold">Adresse:</h3>
                    <p className='indent'>Alte Poststrasse 3</p>
                    <p className='indent'>8172 Niederglatt </p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Telefon / WhatsApp:  </h3>
                    <p className='indent'>+41 764711672</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">E-Mail:  </h3>
                    <p className='indent'>Amaros@bluewin.ch</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Haftungsausschluss:  </h3>
                    <p className='indent'>Die Inhalte unserer Seiten wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Haftung für Links:  </h3>
                    <p className='indent '>Unsere Website kann Links zu externen Websites Dritter enthalten. Auf deren Inhalte haben wir keinen Einfluss. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.</p>
                </div>
                </div>
            </div>
            <Footer/>
        </section>
    );
};
export default Imprint;