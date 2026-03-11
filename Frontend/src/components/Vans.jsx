import React from 'react'
import { Vehicles } from '../data/Vehicles'
import Cards from './Cards'

const Vans=()=>{
    return(
        <section className='m-3'>
        <div className='flex flex-col items-center mb-5'>
            <h2 className='text-3xl md:text-4xl font-medium my-2 text-center bg-gradient-to-r from-yellow-700/90  to-yellow-600/80 text-transparent bg-clip-text'>Welcher Amaros Lieferwagen passt zu deinem Umzug?</h2>
            <p className='text-sm md:text-lg text-center'>Sie stehen nicht lange ungenutzt herum. Melde dich noch heute — morgen könnte dieser Lieferwagen schon jemand anderem beim Umzug helfen.</p>
        </div>
        <div className='flex flex-wrap gap-6 justify-center '>
            {
                Vehicles.map(vehicle=>(
                    <Cards key={vehicle.id} {...vehicle}/>
                ))
            }
        </div>
        </section>
    )
}
export default Vans