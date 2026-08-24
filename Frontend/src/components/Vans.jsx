import React from 'react'
import { useVehicles } from "../hooks/useVehicles.js";
import PageLoader from "./PageLoader";
import Cards from './Cards'

const Vans = () => {
  const { vehicles, loading, error } = useVehicles();

  return (
    <PageLoader>
      <section className='m-3 pb-10'>
        <div className='flex flex-col text-amber-950 items-center mb-5'>
          <h2 className='text-3xl md:text-3xl font-medium my-2  text-center bg-gradient-to-r from-yellow-700/90  to-yellow-600/80 text-transparent bg-clip-text'>Welcher Amaros Lieferwagen passt zu deinem Umzug?</h2>
          <p className='text-sm font-bold md:text-base lg:text-lg text-center'>Sie stehen nicht lange ungenutzt herum. Melde dich noch heute — morgen könnte dieser Lieferwagen schon jemand anderem beim Umzug helfen.</p>
        </div>

        {loading && (
          <p className="text-center my-10">Lade Fahrzeuge…</p>
        )}

        {!loading && error && (
          <p className="text-center my-10">Fahrzeuge konnten nicht geladen werden.</p>
        )}

        {!loading && !error && (
          <div className='flex flex-wrap gap-6 justify-center '>
            {
              vehicles.map(vehicle => (
                <Cards key={vehicle.id} {...vehicle} />
              ))
            }
          </div>
        )}
      </section>
    </PageLoader>
  )
}
export default Vans