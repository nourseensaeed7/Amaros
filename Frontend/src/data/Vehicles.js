import volkswagen from "../assets/vehicles/VW/volkswagen.jpeg";
import volkswagen1 from "../assets/vehicles/VW/VW1.jpeg";
import volkswagen2 from "../assets/vehicles/VW/VW2.jpeg";
import iveo from "../assets/vehicles/iveco/iveo.jpeg";
import mercedes from "../assets/vehicles/mercedes/mercedes.jpeg"
import mercedes1 from "../assets/vehicles/mercedes/mercedes1.jpeg"
export const Vehicles =[
    {
        id:1,
        name:"VW Kasten mit Hebebühne",
        price:150,
        payload:"970 kg",
        fuel:"Diesel",
        transmission:"Manual",
        seats:3,
        image:[volkswagen,volkswagen1,volkswagen2]
    },
    {
        id:2,
        name:"IVECO Transporter lang-Version",
        price:120,
        payload:"1200 kg",
        fuel:"Diesel",
        transmission:"Manual",
        seats:3,
        image:[iveo,]
    },
{
    id:3,
    name:"Mercedes Sprinter Kofferaufbau",
    price:170,
    payload:"810 kg",
    fuel:"Diesel",
    transmission:"Manual",
    seats:3,
    image:[mercedes,mercedes1]
}

]