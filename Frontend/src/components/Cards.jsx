import React from "react";
import { MdCarRental } from "react-icons/md";
import { BsFuelPumpDiesel } from "react-icons/bs";
import { TbManualGearbox } from "react-icons/tb";
import { MdAirlineSeatReclineNormal } from "react-icons/md";
import { GrCapacity } from "react-icons/gr";
import { FaArrowRight } from "react-icons/fa";
import {useNavigate } from "react-router-dom";

const Cards = ({
  id,
  image,
  name,
  price,
  fuel,
  transmission,
  seats,
  payload,
}) => {
    const navigate=useNavigate();
  return (
    <div
      className="w-80 bg-gradient-to-br from-yellow-700/80 via-amber-100 to-yellow-600/80 
      rounded-lg backdrop-blur-sm 
      shadow-[0_12px_30px_rgba(120,90,20,0.3)] 
      overflow-hidden flex flex-col  justify-between text-black"
    >
      <div>
        <img src={image[0]} alt={name} className="w-full p-1 h-80  object-cover" />
      </div>
      <div className="p-4">
        <h2 className="text-2xl flex font-semibold m-0 min-h-15">{name}</h2>
        <h3 className="my-2 font font-medium flex">
          <MdCarRental className="text-xl" />
          {price}.-CHF/Tag
        </h3>
        <hr></hr>
        <div className="flex justify-between my-3 ">
          <div className="flex items-center justify-center gap-1">
            <BsFuelPumpDiesel className="" />
            <span className="block" >{fuel}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <TbManualGearbox className="" />
            <span className="block" > {transmission}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <MdAirlineSeatReclineNormal className=" " />
            <span className="block" > {seats}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <GrCapacity className="" />
            <span className="block" > {payload}</span>
          </div>
        </div>
        <hr></hr>
      </div>
      <button
        className=" py-3 rounded-lg m-2 flex items-center justify-center  text-amber-50 cursor-pointer font-bold bg-black transition"
        onClick={()=>navigate(`/Vehicle-Details/${id}`)}
      >
        Details anzeigen <FaArrowRight className="mx-1" />{" "}
      </button>
    </div>
  );
};
export default Cards;
