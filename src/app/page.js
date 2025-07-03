"use client";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react";
import Scene from "./components/Horoscope"
import Global from "./components/model";
import Speed from "./components/Speed";

const Home = () => {
  return (
    <>
      <Global />
      {/* <Scene /> */}
      
        {/* <Speed /> */}
      
    </>
  );
};

export default Home;